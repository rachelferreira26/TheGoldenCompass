import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_KEY = 'categories';
const PRODUCTS_KEY = 'products';

export const getCategories = async () => {
  const json = await AsyncStorage.getItem(CATEGORIES_KEY);
  return json ? JSON.parse(json) : [];
};

export const saveCategories = async (categories) => {
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const getProducts = async () => {
  const json = await AsyncStorage.getItem(PRODUCTS_KEY);
  return json ? JSON.parse(json) : [];
};

export const saveProducts = async (products) => {
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};
