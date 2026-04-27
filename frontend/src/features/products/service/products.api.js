import axios from "axios";

const productsApiInstance = axios.create({
  baseURL: "/api/products",
  withCredentials: true,
});

export const createProduct = async (formData) => {
  try {
    const response = await productsApiInstance.post("/", formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSellerProducts = async () => {
  try {
    const response = await productsApiInstance.get("/seller");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const response = await productsApiInstance.get("/allProducts");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductById = async (productId) => {
  try {
    const response = await productsApiInstance.get(`/detail/${productId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addProductVariant = async (productId,newProductVariant) =>{
  try {
    const formData = new FormData()

    newProductVariant.images.forEach((image) => {
      formData.append(`images`, image.file)
    })

    formData.append("stock", newProductVariant.stock)
    formData.append("priceAmount", newProductVariant.price)
    formData.append("attributes", JSON.stringify(newProductVariant.attributes))

    const response = await productsApiInstance.post(`/${productId}/variants`, formData)

    return response.data
    
  } catch (error) {
    throw error 
  }
}