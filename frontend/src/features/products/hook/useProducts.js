import {
  setError,
  setSellerProducts,
  setLoading,
  setAllProducts,
} from "../state/products.slice";
import {
  createProduct,
  getSellerProducts,
  getAllProducts,
  getProductById,
  addProductVariant,
} from "../service/products.api";
import { useDispatch } from "react-redux";

export const useProducts = () => {
  const dispatch = useDispatch();

  const handleCreateProduct = async (formData) => {
    dispatch(setLoading(true));
    try {
      const data = await createProduct(formData);
      return data.product;
    } catch (error) {
      dispatch(setError(error));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGetSellerProducts = async () => {
    dispatch(setLoading(true));
    try {
      const data = await getSellerProducts();
      dispatch(setSellerProducts(data.products));
    } catch (error) {
      dispatch(setError(error));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGetAllProducts = async () => {
    dispatch(setLoading(true));
    try {
      const data = await getAllProducts();
      dispatch(setAllProducts(data.products));
      return data.products;
    } catch (error) {
      dispatch(setError(error));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGetProductById = async (productId) => {
    dispatch(setLoading(true));
    try {
      const data = await getProductById(productId);
      return data.product;
    } catch (error) {
      dispatch(setError(error));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAddProductVariant = async (productId,newProductVariant) =>{
    dispatch(setLoading(true))
    try {
      const data = await addProductVariant(productId,newProductVariant)
      return data
    } catch (error) {
      dispatch(setError(error))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return {
    handleCreateProduct,
    handleGetSellerProducts,
    handleGetAllProducts,
    handleGetProductById,
    handleAddProductVariant
  };
};
