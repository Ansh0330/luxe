import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useProducts } from "../hook/useProducts";
import { useSelector } from "react-redux";
import Navbar from "../../common/components/Navbar";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const { handleGetProductById } = useProducts();

  const fetchProductDetails = async () => {
    try {
      const data = await handleGetProductById(productId);
      setProduct(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      if (!v.attributes) return false;
      const vKeys = Object.keys(v.attributes);
      const sKeys = Object.keys(selectedAttributes);
      const isMatch = vKeys.every((k) => v.attributes[k] === selectedAttributes[k]);
      return vKeys.length === sKeys.length && isMatch;
    });
  }, [product, selectedAttributes]);

  const availableAttributes = useMemo(() => {
    if (!product?.variants) return {};
    const attrs = {};
    product.variants.forEach((variant) => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!attrs[key]) attrs[key] = new Set();
          attrs[key].add(value);
        });
      }
    });
    Object.keys(attrs).forEach((key) => {
      attrs[key] = Array.from(attrs[key]);
    });
    return attrs;
  }, [product]);

  useEffect(() => {
    setSelectedImage(0);
  }, [activeVariant]);

  const handleAttributeChange = (attrName, value) => {
    // If the selected value is clicked again, deselect it to return to the original state
    if (selectedAttributes[attrName] === value) {
      const newAttrs = { ...selectedAttributes };
      delete newAttrs[attrName];
      setSelectedAttributes(newAttrs);
      return;
    }

    const newAttrs = { ...selectedAttributes, [attrName]: value };

    const exactMatch = product.variants.find((v) => {
      const vAttrs = v.attributes || {};
      return (
        Object.keys(newAttrs).every((k) => newAttrs[k] === vAttrs[k]) &&
        Object.keys(vAttrs).every((k) => newAttrs[k] === vAttrs[k])
      );
    });

    if (exactMatch) {
      setSelectedAttributes(exactMatch.attributes);
    } else {
      const fallbackVariant = product.variants.find(
        (v) => v.attributes && v.attributes[attrName] === value
      );
      if (fallbackVariant) {
        setSelectedAttributes(fallbackVariant.attributes);
      } else {
        setSelectedAttributes(newAttrs);
      }
    }
  };

  const displayImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product?.images && product.images.length > 0
        ? product.images
        : [];

  const displayPrice = activeVariant?.price?.amount
    ? activeVariant.price
    : product?.price;

  const handleNextImage = () => {
    if (displayImages && displayImages.length > 0) {
      setSelectedImage((prev) => (prev + 1) % displayImages.length);
    }
  };

  const handlePrevImage = () => {
    if (displayImages && displayImages.length > 0) {
      setSelectedImage(
        (prev) => (prev - 1 + displayImages.length) % displayImages.length,
      );
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-[#FFD700] rounded-full animate-spin"></div>
          <p className="text-[#e5e2e1] font-['Manrope'] tracking-[0.2em] uppercase text-xs mt-6">
            Loading Curated Piece...
          </p>
        </div>
      </div>
    );
  }
  console.log(product)

  return (
    <div className="bg-[#131313] text-[#e5e2e1] font-['Manrope'] min-h-screen overflow-x-hidden selection:bg-[#ffd700] selection:text-[#3a3000]">
      {/* TopNavBar */}
      <Navbar />

      {/* Main content wrapper bounds to exactly screen height so everything fits without scrolling to see it */}
      <main className="min-h-screen flex flex-col md:flex-row">
        {/* Left Side: Image Gallery */}
        <section className="w-full md:w-1/2 relative bg-[#1c1b1b] flex flex-col group rounded-r-3xl md:rounded-r-none pt-24 pb-12">
          <div className="flex-grow flex items-center justify-center p-6 md:p-10">
            {/* The image is constrained by max-height so it won't push content below the viewport fold */}
            <div className="relative w-full aspect-[4/5] max-w-[24rem] xl:max-w-[28rem] max-h-[60vh] mx-auto group/image">
              {displayImages && displayImages.length > 0 ? (
                <img
                  src={displayImages[selectedImage]?.url}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-xl shadow-2xl transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full bg-[#131313] flex flex-col items-center justify-center rounded-xl shadow-2xl">
                  <span className="material-symbols-outlined text-4xl text-[#353534] mb-2">
                    image
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-[#353534] uppercase font-['Manrope']">
                    Studio Shot Pending
                  </span>
                </div>
              )}
              {/* Floating Badge */}
              <div className="absolute top-4 left-4 bg-[#2a2a2a]/60 backdrop-blur-md px-4 py-2 rounded-full z-10">
                <p className="text-[0.6rem] tracking-[0.3em] uppercase text-[#e9c400]">
                  Edition 01/50
                </p>
              </div>

              {/* Carousel Controls (Hidden until Hover) */}
              {displayImages && displayImages.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 pointer-events-none z-10">
                  <button
                    onClick={handlePrevImage}
                    className="pointer-events-auto p-3 bg-[#131313]/60 backdrop-blur-md rounded-full text-[#FFD700] hover:bg-[#131313]/90 transition-all active:scale-95 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      chevron_left
                    </span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="pointer-events-auto p-3 bg-[#131313]/60 backdrop-blur-md rounded-full text-[#FFD700] hover:bg-[#131313]/90 transition-all active:scale-95 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      chevron_right
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {displayImages && displayImages.length > 1 && (
            <div className="px-8 pb-8 overflow-x-auto no-scrollbar flex space-x-4 justify-center">
              {displayImages.map((img, index) => (
                <div
                  key={img._id || index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all ${selectedImage === index ? "ring-1 ring-[#ffd700]/40" : "hover:ring-1 hover:ring-[#ffd700]/20"}`}
                >
                  <img
                    src={img.url}
                    alt={`Detail ${index + 1}`}
                    className={`w-full h-full object-cover transition-all duration-300 ${selectedImage === index ? "grayscale-0" : "grayscale hover:grayscale-0"}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Details Section */}
        <section className="w-full md:w-1/2 bg-[#131313] flex flex-col px-8 md:px-20 relative pt-28 pb-12 md:pt-36 md:pb-24">
          <div className="max-w-xl w-full mx-auto md:mx-0 relative z-10 my-auto">
            <div className="space-y-2 mb-6">
              <p className="font-['Manrope'] text-[0.7rem] tracking-[0.4em] uppercase text-[#dbc677]">
                Curated by {product.sellerId?.fullname || "Aurelian Studio"}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#fff6df] leading-tight">
                {product.title}
              </h1>
            </div>

            <div className="mb-6">
              <p className="text-2xl font-bold text-[#ffd700] tracking-tight">
                {displayPrice?.currency === "USD"
                  ? "$"
                  : displayPrice?.currency === "INR"
                    ? "₹"
                    : displayPrice?.currency}
                {displayPrice?.amount?.toLocaleString() || "4,200.00"}
              </p>
              <div className="h-px w-12 bg-[#4d4732]/30 mt-4"></div>
            </div>

            {/* Options/Variants */}
            {Object.keys(availableAttributes).length > 0 && (
              <div className="mb-8 flex flex-col gap-6">
                {Object.entries(availableAttributes).map(([attrName, values]) => (
                  <div key={attrName}>
                    <h3 className="text-[0.65rem] tracking-[0.2em] uppercase text-[#999077] mb-3">
                      {attrName}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {values.map((val) => {
                        const isSelected = selectedAttributes[attrName] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleAttributeChange(attrName, val)}
                            className={`px-5 py-2.5 text-[0.7rem] uppercase tracking-widest font-['Manrope'] font-bold transition-all duration-300 border rounded-full ${
                              isSelected
                                ? "border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                                : "border-[#4d4732]/40 text-[#d0c6ab] hover:border-[#ffd700]/50 hover:bg-[#2a2a2a]"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stock Information */}
            {activeVariant && activeVariant.stock !== undefined && (
              <div className="mb-6">
                <span
                  className={`text-[0.65rem] tracking-[0.2em] uppercase font-bold tracking-widest ${
                    activeVariant.stock > 0 ? "text-[#a3b18a]" : "text-[#e07a5f]"
                  }`}
                >
                  {activeVariant.stock > 0
                    ? `${activeVariant.stock} IN STOCK`
                    : "OUT OF STOCK"}
                </span>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <p className="text-base text-[#d0c6ab] leading-relaxed tracking-wide font-light line-clamp-3">
                {product.description}
              </p>

              {/* Editorial Accent Image */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 h-24 rounded-lg overflow-hidden bg-[#1c1b1b] group">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-6fp6e_o18vLLrpYDD5L4dNcy0UiDiIksrcZxQqxuJqHAGuPaOhP79loJfLtP35xa1SuKIwSm4RRbay-JjC0IdoUOnaW01ATvd2m6xmyAaQMvyaZJi7RNmj9rHMy07Ghc-rTPfXA53lPT5nUUj_Yyba4BPF00eWhbF7jMzai1EcTogI7MNiycx_lW3XwU3WmLsjg0XVSuEqLflmW7KkG3VASyOYVSsalXiTs_qA8N_nv7pCk9ZrgSSZzjFt_4z1fPbXSirzQkcmE"
                    alt="Material accent"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="col-span-8">
                  <h3 className="text-[0.65rem] tracking-[0.2em] uppercase text-[#999077] mb-2">
                    Tactile Synthesis
                  </h3>
                  <p className="text-[0.75rem] text-[#d0c6ab] italic font-light leading-relaxed">
                    "The way light dies across its surface is intentional. It is
                    designed to be felt in the dark."
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction Zone */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-[#ffd700] text-[#3a3000] font-['Manrope'] font-bold py-4 px-8 rounded-full uppercase tracking-widest text-[0.7rem] hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_10px_40px_-10px_rgba(255,215,0,0.2)]">
                Buy Now
              </button>
              <button className="flex-1 bg-transparent border border-[#4d4732]/40 text-[#fff6df] font-['Manrope'] font-bold py-4 px-8 rounded-full uppercase tracking-widest text-[0.7rem] hover:bg-[#2a2a2a] hover:border-[#ffd700]/40 transition-all">
                Add to Cart
              </button>
            </div>

            {/* Footer-like details */}
            <div className="mt-8 flex space-x-10 border-t border-[#4d4732]/10 pt-4">
              <div>
                <span className="block text-[0.6rem] uppercase tracking-widest text-[#999077] mb-1">
                  Authenticity
                </span>
                <span className="text-sm font-medium text-[#e5e2e1]">
                  Verified
                </span>
              </div>
              <div>
                <span className="block text-[0.6rem] uppercase tracking-widest text-[#999077] mb-1">
                  Condition
                </span>
                <span className="text-sm font-medium text-[#e5e2e1]">
                  Pristine
                </span>
              </div>
            </div>
          </div>

          {/* Background subtle atmospheric glow */}
          <div className="absolute -right-20 bottom-20 w-80 h-80 bg-[#ffd700]/5 rounded-full blur-[100px] pointer-events-none"></div>
        </section>
      </main>

      {/* Footer Component */}
      <footer className="w-full py-16 px-12 mt-0 bg-[#1c1b1b] relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-[1920px] mx-auto space-y-8 md:space-y-0 relative z-10">
          <div className="text-lg font-semibold text-[#FFF6DF]">
            Luxe{" "}
            <span className="font-light text-xs tracking-widest ml-4 text-[#999077]">
              ARCHITECTURAL CATALOG
            </span>
          </div>
          <nav className="flex space-x-8">
            <a
              href="#"
              className="font-['Manrope'] text-[0.75rem] tracking-widest uppercase text-[#D0C6AB] hover:text-[#ffd700] transition-colors"
            >
              Sustainability
            </a>
            <a
              href="#"
              className="font-['Manrope'] text-[0.75rem] tracking-widest uppercase text-[#D0C6AB] hover:text-[#ffd700] transition-colors"
            >
              Contact
            </a>
            <a
              href="#"
              className="font-['Manrope'] text-[0.75rem] tracking-widest uppercase text-[#D0C6AB] hover:text-[#ffd700] transition-colors"
            >
              Press
            </a>
            <a
              href="#"
              className="font-['Manrope'] text-[0.75rem] tracking-widest uppercase text-[#D0C6AB] hover:text-[#ffd700] transition-colors"
            >
              Legal
            </a>
          </nav>
          <div className="font-['Manrope'] text-[0.6rem] tracking-widest uppercase text-[#999077]">
            © {new Date().getFullYear()} Luxe Architectural Catalog. All Rights
            Reserved.
          </div>
        </div>
        {/* Soft atmospheric glow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent"></div>
      </footer>
    </div>
  );
};

export default ProductDetail;
