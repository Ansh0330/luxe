import React, { useEffect, useState } from "react";
import { useProducts } from "../hook/useProducts";
import { useParams } from "react-router";


// Helper icons
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const SellerProductDetails = () => {
  const [product, setProduct] = useState(null);
  const [localVariants, setLocalVariants] = useState([]);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [loading, setLoading] = useState(true);

  // UI state for inputs to maintain focus
  const [attributeInputs, setAttributeInputs] = useState([
    { key: "", value: "" },
  ]);

  // New variant state
  const [newVariant, setNewVariant] = useState({
    images: [],
    stock: 0,
    attributes: {}, // Strictly an object
    price: { amount: "", currency: "INR" },
  });

  const { productId } = useParams();
  const { handleGetProductById, handleAddProductVariant } = useProducts();

  async function fetchProductDetails() {
    setLoading(true);
    try {
      const data = await handleGetProductById(productId);
      const prod = data?.product || data;
      setProduct(prod);
      // Initialize variants locally
      if (prod?.variants) {
        setLocalVariants(prod.variants);
      }
    } catch (error) {
      console.error("Failed to fetch product details", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  // Handlers for modifying existing variant stock natively
  const handleStockChange = (index, newStock) => {
    const updatedVariants = [...localVariants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      stock: Number(newStock),
    };
    setLocalVariants(updatedVariants);
  };

  // Handlers for New Variant Form
  const handleAddNewVariant = async () => {
    // Validate required at least one attribute to be filled
    const hasValidAttribute = attributeInputs.some(
      (attr) => attr.key.trim() && attr.value.trim(),
    );
    if (!hasValidAttribute) {
      alert("At least one valid attribute is required.");
      return;
    }

    // Maps preview URL so the variant list can display the image locally
    const cleanImages = newVariant.images.map((img) => ({
      url: img.previewUrl,
      file: img.file,
    }));

    // Attributes is already an object in newVariant, just use it safely
    const cleanAttributes = { ...newVariant.attributes };

    const variantToSave = {
      images: cleanImages,
      stock: Number(newVariant.stock),
      attributes: cleanAttributes,
      price: newVariant.price.amount
        ? Number(newVariant.price.amount)
        : undefined, // price is optional
    };

    setLocalVariants([...localVariants, variantToSave]);
    setIsAddingVariant(false);

    await handleAddProductVariant(productId, variantToSave);

    // Reset form
    // Note: should ideally revoke old object URLs as well to prevent memory leaks if it were a long-lived SPA
    setAttributeInputs([{ key: "", value: "" }]);
    setNewVariant({
      images: [],
      stock: 0,
      attributes: {},
      price: { amount: "", currency: "INR" },
    });
  };

  const handleAddAttribute = () => {
    setAttributeInputs((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleAttributeChange = (index, field, value) => {
    const updatedInputs = [...attributeInputs];
    updatedInputs[index][field] = value;
    setAttributeInputs(updatedInputs);

    // Synchronize to object format
    const newAttrsObj = {};
    updatedInputs.forEach((attr) => {
      if (attr.key.trim() !== "") {
        newAttrsObj[attr.key.trim()] = attr.value;
      }
    });
    setNewVariant((prev) => ({ ...prev, attributes: newAttrsObj }));
  };

  const handleRemoveAttribute = (index) => {
    const updatedInputs = attributeInputs.filter((_, i) => i !== index);
    setAttributeInputs(updatedInputs);

    // Synchronize to object format
    const newAttrsObj = {};
    updatedInputs.forEach((attr) => {
      if (attr.key.trim() !== "") {
        newAttrsObj[attr.key.trim()] = attr.value;
      }
    });
    setNewVariant((prev) => ({ ...prev, attributes: newAttrsObj }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const availableSlots = 7 - newVariant.images.length;
    const filesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      alert(`You can only upload up to 7 images. ${filesToAdd.length} added.`);
    }

    const newImageObjects = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewVariant((prev) => ({
      ...prev,
      images: [...prev.images, ...newImageObjects],
    }));

    // Clear the input so identical files can be selected again if needed
    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = newVariant.images[index];
    if (imageToRemove?.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    const updatedImages = newVariant.images.filter((_, i) => i !== index);
    setNewVariant((prev) => ({ ...prev, images: updatedImages }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-[#fff6df] font-manrope">
        Loading gallery...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center text-[#fff6df] font-manrope">
        Product Not Found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-manrope selection:bg-[#ffd700] selection:text-[#3a3000] pb-24">
      {/* Global Navbar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/90 backdrop-blur-md text-[#FFD700] font-manrope tracking-tight flex justify-between items-center px-8 md:px-12 py-6">
        <div
          onClick={() => navigate("/")}
          className="text-2xl font-black tracking-[0.2em] text-[#FFF6DF] cursor-pointer hover:opacity-80 transition-opacity"
        >
          LUXE.
        </div>

        <div className="flex items-center space-x-10">
          <nav className="hidden md:flex space-x-8 text-sm uppercase tracking-widest">
            <a className="text-[#FFD700] font-bold hover:text-[#FFF6DF] transition-colors duration-300 cursor-pointer">
              Catalog
            </a>
            <a className="text-[#d0c6ab] hover:text-[#FFF6DF] transition-colors duration-300 cursor-pointer">
              Showroom
            </a>
            <a className="text-[#d0c6ab] hover:text-[#FFF6DF] transition-colors duration-300 cursor-pointer">
              Archive
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/seller/create-product")}
              className="hidden md:flex items-center gap-2 bg-[#ffd700] text-[#3a3000] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              New Listing
            </button>
            <span className="material-symbols-outlined hover:text-[#FFF6DF] cursor-pointer transition-colors duration-300 text-[#d0c6ab]">
              account_circle
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 mt-32">
        {/* Base Product Info */}
        <section className="flex flex-col md:flex-row gap-8 mb-16">
          <div className="w-full md:w-1/2">
            {/* Gallery placeholder */}
            <div className="w-full aspect-[4/5] bg-[#1c1b1b] overflow-hidden rounded-xl">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#d0c6ab]">
                  No Image
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#1c1b1b]">
                {product.images.slice(1).map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={`Thumb ${i}`}
                    className="w-20 h-24 object-cover bg-[#1c1b1b] shrink-0 rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <h2 className="font-extrabold text-4xl md:text-5xl leading-tight mb-4 tracking-tighter text-[#fff6df] uppercase">
              {product.title}
            </h2>
            <p className="text-[#d0c6ab] font-light text-lg mb-6 leading-relaxed max-w-md">
              {product.description}
            </p>
            <div className="text-2xl tracking-wide font-light text-[#ffd700] mb-8">
              {product.price?.amount} {product.price?.currency}
            </div>
          </div>
        </section>

        {/* Variants & Inventory */}
        <section className="bg-[#1c1b1b] p-6 md:p-12 rounded-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <h3 className="font-extrabold tracking-tighter text-[#fff6df] text-3xl uppercase">
              Variants & Inventory
            </h3>
            {!isAddingVariant && (
              <button
                onClick={() => setIsAddingVariant(true)}
                className="bg-[#ffd700] text-[#3a3000] px-6 py-3 uppercase tracking-widest text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] flex items-center gap-2 cursor-pointer rounded-full"
              >
                <PlusIcon /> Add New Variant
              </button>
            )}
          </div>

          {/* Add New Variant Form */}
          {isAddingVariant && (
            <div className="bg-[#131313] p-6 md:p-8 mb-12 shadow-2xl rounded-xl border border-[#2a2a2a]">
              <div className="flex justify-between items-center mb-8 border-b border-[#2a2a2a] pb-4">
                <h4 className="font-extrabold text-[#fff6df] tracking-tight text-xl uppercase">
                  Create Variant
                </h4>
                <button
                  onClick={() => setIsAddingVariant(false)}
                  className="text-[#d0c6ab] hover:text-[#ffd700] text-xs uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Left Col: Attributes & Basics */}
                <div className="space-y-6">
                  {/* Dynamic Attributes */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-[#d0c6ab] mb-4">
                      Attributes (e.g. Size, Color) *
                    </label>
                    <div className="space-y-4">
                      {attributeInputs.map((attr, index) => (
                        <div key={index} className="flex gap-4 items-center">
                          <input
                            type="text"
                            placeholder="Key (e.g., Size)"
                            value={attr.key}
                            onChange={(e) =>
                              handleAttributeChange(
                                index,
                                "key",
                                e.target.value,
                              )
                            }
                            className="w-1/2 bg-[#1c1b1b] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#fff6df] focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/30 placeholder:text-[#d0c6ab]/50 transition-all"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g., M)"
                            value={attr.value}
                            onChange={(e) =>
                              handleAttributeChange(
                                index,
                                "value",
                                e.target.value,
                              )
                            }
                            className="w-1/2 bg-[#1c1b1b] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#fff6df] focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/30 placeholder:text-[#d0c6ab]/50 transition-all"
                          />
                          {attributeInputs.length > 1 && (
                            <button
                              onClick={() => handleRemoveAttribute(index)}
                              className="text-red-400 p-3 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors cursor-pointer shrink-0"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddAttribute}
                      className="mt-4 text-[#ffd700] text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:brightness-110 cursor-pointer transition-all"
                    >
                      <PlusIcon /> Add Attribute
                    </button>
                  </div>

                  {/* Stock & Price */}
                  <div className="flex gap-6">
                    <div className="w-1/2">
                      <label className="block text-xs uppercase tracking-widest font-bold text-[#d0c6ab] mb-2">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        value={newVariant.stock}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            stock: e.target.value,
                          })
                        }
                        className="w-full bg-[#1c1b1b] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#fff6df] focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/30 transition-all"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs uppercase tracking-widest font-bold text-[#d0c6ab] mb-2">
                        Price Amount (Optional)
                      </label>
                      <input
                        type="number"
                        value={newVariant.price.amount}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            price: {
                              ...newVariant.price,
                              amount: e.target.value,
                            },
                          })
                        }
                        placeholder="Default if empty"
                        className="w-full bg-[#1c1b1b] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#fff6df] focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/30 placeholder:text-[#d0c6ab]/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Right Col: Images */}
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="block text-xs uppercase tracking-widest font-bold text-[#d0c6ab]">
                      Image Upload (Max 7)
                    </label>
                    <span className="text-xs text-[#ffd700] bg-[#ffd700]/10 px-2 py-1 rounded">
                      {newVariant.images.length}/7
                    </span>
                  </div>

                  {newVariant.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {newVariant.images.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-[4/5] bg-[#1c1b1b] rounded-lg overflow-hidden group"
                        >
                          <img
                            src={img.previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm hover:bg-red-500"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {newVariant.images.length < 7 && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-[#d0c6ab]
                          file:mr-4 file:py-3 file:px-6
                          file:border-0 file:rounded-full file:bg-[#1c1b1b] file:text-[#fff6df]
                          hover:file:bg-[#2a2a2a] file:cursor-pointer file:uppercase file:text-xs file:tracking-widest file:font-bold file:transition-colors
                          cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleAddNewVariant}
                  className="bg-[#ffd700] text-[#3a3000] px-8 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_25px_rgba(255,215,0,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Save Variant
                </button>
              </div>
            </div>
          )}

          {/* Variants List */}
          {localVariants.length === 0 ? (
            <div className="py-16 text-center text-[#d0c6ab] bg-[#131313] rounded-xl border border-[#2a2a2a] border-dashed">
              <p className="font-light tracking-wide">
                No variants have been created yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {localVariants.map((variant, idx) => (
                <div
                  key={idx}
                  className="bg-[#131313] flex flex-col pt-5 rounded-xl border border-[#2a2a2a] overflow-hidden hover:border-[#ffd700]/30 transition-colors"
                >
                  <div className="px-6 flex gap-5 h-24 mb-6">
                    {/* Variant Thumb */}
                    <div className="w-16 h-20 bg-[#1c1b1b] shrink-0 rounded-lg overflow-hidden border border-[#2a2a2a]">
                      {variant.images && variant.images.length > 0 ? (
                        <img
                          src={variant.images[0].url}
                          alt="Variant"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#d0c6ab]">
                          N/A
                        </div>
                      )}
                    </div>
                    {/* Attributes */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(variant.attributes || {}).map(
                          ([key, val]) => (
                            <span
                              key={key}
                              className="bg-[#1c1b1b] px-2.5 py-1 text-[10px] rounded uppercase tracking-widest text-[#fff6df] border border-[#2a2a2a]"
                            >
                              <span className="text-[#d0c6ab]/70 mr-1">
                                {key}:
                              </span>
                              {val}
                            </span>
                          ),
                        )}
                      </div>
                      <div className="text-sm font-light text-[#ffd700]">
                        {variant.price?.amount
                          ? `${variant.price.amount} ${variant.price.currency}`
                          : "Base Price"}
                      </div>
                    </div>
                  </div>

                  {/* Stock Management Row */}
                  <div className="mt-auto border-t border-[#2a2a2a] bg-[#1c1b1b]/50 flex items-center px-6 py-4 justify-between">
                    <label className="text-xs text-[#d0c6ab] uppercase tracking-widest font-bold">
                      Current Stock
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={variant.stock || 0}
                        onChange={(e) => handleStockChange(idx, e.target.value)}
                        className="w-20 bg-[#131313] border border-[#2a2a2a] rounded text-center py-1.5 text-[#fff6df] focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/30 font-medium transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SellerProductDetails;
