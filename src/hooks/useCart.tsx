import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockData } = await api.get<Stock>(`stock/${productId}`);

      const productExistsInCart = cart.find(
        (productCart) => productCart.id === productId
      );

      const amount = productExistsInCart ? productExistsInCart.amount + 1 : 1;

      if (amount > stockData.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExistsInCart) {
        const addNewProductInCart = cart.map((productCart) => {
          if (productCart.id === productId) {
            return {
              ...productExistsInCart,
              amount: productCart.amount + 1,
            };
          }

          return productCart;
        });
        setCart(addNewProductInCart);

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(addNewProductInCart)
        );

        return;
      }

      const { data: productData } = await api.get<Product>(
        `products/${productId}`
      );

      const newProductToAddInCart = {
        ...productData,
        amount: 1,
      };

      const productsArray = [...cart, newProductToAddInCart];

      setCart(productsArray);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(productsArray));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find((cartItem) => cartItem.id === productId);

      if (!productExists) {
        throw new Error("Produto não encontrado no carrinho");
      }

      const removeProductFromCart = cart.filter(
        (product) => product.id !== productId
      );

      setCart(removeProductFromCart);

      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(removeProductFromCart)
      );
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        throw new Error("Alteração inválida");
      }

      const { data: stockData } = await api.get<Stock>(`stock/${productId}`);

      if (stockData.amount <= amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updateProductAmountItens = cart.map((productCart) => {
        if (productCart.id === productId) {
          return {
            ...productCart,
            amount,
          };
        }
        return productCart;
      });

      setCart(updateProductAmountItens);

      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(updateProductAmountItens)
      );
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
