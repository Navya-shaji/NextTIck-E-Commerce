const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");

// Get Cart...................................................................
const getCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    const cartItems = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "productName productImage price quantity salesPrice",
      model: "Product",
    });

    if (!cartItems) {
      return res.render("cart", {
        cart: null,
        products: [],
        totalAmount: 0,
        user: user,
      });
    }

    const validItems = cartItems.items
      .filter((item) => item.productId != null)
      .map((item) => ({
        ...item.toObject(),
        isOutOfStock: item.productId.quantity < 1,
        availableStock: item.productId.quantity,
        maxAllowedQuantity: Math.min(5, item.productId.quantity),
        // Ensure price is using salesPrice from product
        price: item.price,
        originalPrice: item.productId.regularPrice,
        totalPrice: item.quantity * item.price
      }));

    const totalAmount = validItems.reduce(
      (sum, item) => (item.status === "placed" ? sum + item.totalPrice : sum),
      0
    );

    res.render("cart", {
      cart: cartItems,
      products: validItems,
      totalAmount,
      user: user,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).render("error", {
      message: "Failed to load cart",
    });
  }
};

// Update Quantity
const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, quantity } = req.body;

    // Validate quantity
    const requestedQuantity = parseInt(quantity);
    if (isNaN(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 5) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 5",
      });
    }

    // Find product and validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (requestedQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} items available in stock`,
      });
    }

    // Find cart and update item
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const cartItem = cart.items.find(
      item => item.productId.toString() === productId && item.status === "placed"
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cartItem.quantity = requestedQuantity;

    cartItem.totalPrice = requestedQuantity * cartItem.price;

    const cartTotal = cart.items.reduce((total, item) => {
      if (item.status === 'placed') {
        return total + item.totalPrice;
      }
      return total;
    }, 0);

    const totalQty = cart.items.reduce((total, item) => total + item.quantity, 0);

    await cart.save();

    res.status(200).json({
      success: true,
      totalPrice: cartItem.totalPrice,
      cartTotal,
      cartCount: totalQty,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update quantity",
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to add items to your cart.",
        redirect: "/login",
      });
    }

    const product = await Product.findById(productId).populate('category'); // Ensure category is populated
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.status === "placed"
    );

    if (existingItem) {
      if (existingItem.quantity >= 5) {
        return res.status(200).json({
          success: false,
          status: "limit_reached",
          message: "Maximum limit of 5 items reached for this product",
          cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
        });
      }

      if (existingItem.quantity + 1 > product.quantity) {
        return res.status(200).json({
          success: false,
          message: `Only ${product.quantity} units available in stock.`
        });
      }

      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.quantity * existingItem.price;

      await cart.save();

      return res.json({
        success: true,
        message: "Quantity updated in your bag",
        cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
      });
    }

    // New item addition
    const finalQuantity = 1;

    if (finalQuantity > product.quantity) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // Calculate offers
    const productOffer = product.productOffer || 0;
    const categoryOffer = product.category?.categoryOffer || 0;

    // Get the best offer
    const bestOffer = Math.max(productOffer, categoryOffer);

    // Calculate discounted price
    const priceAfterDiscount = product.salesPrice * (1 - bestOffer / 100);


    // Add new item
    cart.items.push({
      productId,
      quantity: finalQuantity,
      price: priceAfterDiscount,
      totalPrice: finalQuantity * priceAfterDiscount,
      status: "placed",
    });

    await cart.save();

    // Calculate total items (sum of quantities)
    const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.json({
      success: true,
      message: "Product added to cart successfully",
      cartCount: cartCount
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};



//products  removing from the cart........................................................


const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId && item.status === "placed"
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Calculate total items (sum of quantities)
    const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    // Calculate new cart total
    const cartTotal = cart.items.reduce((total, item) => {
      if (item.status === 'placed') {
        return total + item.totalPrice;
      }
      return total;
    }, 0);

    res.json({
      success: true,
      message: "Item removed successfully",
      cartCount: cartCount,
      cartTotal: cartTotal
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item",
    });
  }
};



module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
};
