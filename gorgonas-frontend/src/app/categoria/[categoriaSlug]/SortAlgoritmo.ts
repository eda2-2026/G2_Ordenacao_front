import { ProdutoParaCard } from "@/components/ProductRow";

function countingSortPreco(arr: ProdutoParaCard[], exp: number): void {}
// Função principal (Radix Sort)
export function radixSortPreco(arr: ProdutoParaCard[], ordem: 'asc' | 'desc' = 'asc'): ProdutoParaCard[] {
  if (arr.length === 0) return arr;

  const produtos = [...arr];
  let maiorPreco: number = Math.floor(Number(produtos[0].preco) * 100);

  for (let i = 0; i < produtos.length; i++) {
    const precoCentavos = Math.floor(Number(produtos[i].preco) * 100);
    if (precoCentavos > maiorPreco) {
      maiorPreco = precoCentavos;
    }
  }

  for (let exp = 1; Math.floor(maiorPreco / exp) > 0; exp *= 10) {
    countingSortPreco(produtos, exp);
  }

  return ordem === 'asc' ? produtos : produtos.reverse();
}