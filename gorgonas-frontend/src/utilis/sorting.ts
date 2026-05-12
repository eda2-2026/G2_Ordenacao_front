import { ProdutoParaCard } from "@/components/ProductRow";

type Comparator<T> = (a: T, b: T) => number;

function merge<T>(left: T[], right: T[], comparator: Comparator<T>): T[] {
  const resultArray: T[] = [];
  let leftIndex = 0;
  let rightIndex = 0;


  while (leftIndex < left.length && rightIndex < right.length) {
    if (comparator(left[leftIndex], right[rightIndex]) <= 0) {
      resultArray.push(left[leftIndex]);
      leftIndex++;
    } else {
      resultArray.push(right[rightIndex]);
      rightIndex++; 
    }
  }

  return resultArray
    .concat(left.slice(leftIndex))
    .concat(right.slice(rightIndex));
}

/**
 * func princ algoritmo Merge Sort.
 * @param {Array} array array a ser ordenado.
 * @param {Function} comparator func de comparação que define a ordem.
 * @returns {Array} array ordenado.
 */

export function mergeSort<T>(array: T[], comparator: Comparator<T>): T[] {
  if (array.length <= 1) {
    return array;
  }

  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);

  return merge(mergeSort(left, comparator), mergeSort(right, comparator), comparator);
}

// calcula a média e contagem de avaliações
const mediaEContagem = (prod: ProdutoParaCard) => {
    const avals = prod.avaliacoes || [];
    const count = avals.length;
    if (count === 0) return { media: 0, count: 0 };
    const soma = avals.reduce((acc, curr) => acc + (curr.nota || 0), 0);
    return { media: soma / count, count };
};

// Comp produtos por avaliação (maior para menor)
export const comparadorPorAvaliacao = (a: ProdutoParaCard, b: ProdutoParaCard): number => {
    const ma = mediaEContagem(a);
    const mb = mediaEContagem(b);
    if (mb.media !== ma.media) return mb.media - ma.media; // 1 Média da nota (descendente)
    if (mb.count !== ma.count) return mb.count - ma.count; // 2 Número de avaliações (descendente)
    return a.nome.localeCompare(b.nome); // 3 Nome do produto (alfabética)
};