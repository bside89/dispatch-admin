import { useState, type SubmitEvent } from "react";
import { createOrder } from "../services/api";
import type { Order } from "../types/Order";

interface Props {
  onCreate: (order: Order) => void;
}

export default function CreateOrder({ onCreate }: Props) {
  const [product, setProduct] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const newOrder = await createOrder({
        product,
        amount: Number(amount),
      });

      onCreate(newOrder);

      setProduct("");
      setAmount("");
    } catch {
      alert("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Product"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
      />

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button disabled={loading}>
        {loading ? "Creating..." : "Create Order"}
      </button>
    </form>
  );
}
