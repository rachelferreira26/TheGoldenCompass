import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductFormScreen from './src/screens/ProductFormScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import { COLORS } from './src/utils/theme';

const Tab = createBottomTabNavigator();
const ProductStack = createStackNavigator();

function ProductsStack() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductsScreen} />
      <ProductStack.Screen name="ProductForm" component={ProductFormScreen} />
      <ProductStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </ProductStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.border,
            paddingBottom: 4,
            height: 60,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Dashboard: focused ? 'grid' : 'grid-outline',
              Products: focused ? 'cube' : 'cube-outline',
              Categories: focused ? 'folder' : 'folder-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Products" component={ProductsStack} />
        <Tab.Screen name="Categories" component={CategoriesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
