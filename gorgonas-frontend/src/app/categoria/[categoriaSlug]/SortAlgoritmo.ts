import { ProdutoParaCard } from "@/components/ProductRow";

// Função auxiliar (Counting Sort)
function countingSortPreco(arr: ProdutoParaCard[], exp: number): void {
  const n = arr.length;
  const output = new Array(n);
  const count = new Array(10).fill(0);

  for (let i = 0; i < n; i++) {
    const precoCentavos = Math.floor(Number(arr[i].preco) * 100);
    const digito = Math.floor(precoCentavos / exp) % 10;
    count[digito]++;
  }

  for (let i = 1; i < 10; i++) {
    count[i] += count[i - 1];
  }

  for (let i = n - 1; i >= 0; i--) {
    const precoCentavos = Math.floor(Number(arr[i].preco) * 100);
    const digito = Math.floor(precoCentavos / exp) % 10;
    output[count[digito] - 1] = arr[i];
    count[digito]--;
  }

  for (let i = 0; i < n; i++) {
    arr[i] = output[i];
  }
}

// Função principal (Radix Sort)
export function radixSortPreco(arr: ProdutoParaCard[], ordem: 'asc' | 'desc' = 'asc'): ProdutoParaCard[] {
  if (arr.length === 0) return arr;

  const produtos = [...arr];
  let maiorPreco: number = Math.floor(Number(produtos[0].preco) * 100);

  for (let i = 1; i < produtos.length; i++) {
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