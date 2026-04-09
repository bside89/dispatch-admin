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
      alert("Erro ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Produto"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
      />

      <input
        placeholder="Valor"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button disabled={loading}>
        {loading ? "Criando..." : "Criar Pedido"}
      </button>
    </form>
  );
}
