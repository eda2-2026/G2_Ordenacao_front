'use client';

import { ProductCard } from './ProductCard';
import Link from 'next/link';

export type ProdutoParaCard = {
    id: number;
    nome: string;
    preco: number | string;
    estoque: number;
    imagens?: { urlImagem: string }[]; 
    loja?: {
        logo?: string | null
        sticker?: string | null;
    } | null;
    unidade?: string;
    avaliacoes?: { nota: number }[];
    createdAt?: string;
};

interface ProductRowProps {
    title?: string;
    products: ProdutoParaCard[]; 
    viewMoreHref: string;
}

export function ProductRow({ title, products, viewMoreHref }: ProductRowProps) {
    return (
        <section className="pb-12">
            
            {title && (
            <h2 className="text-3xl font-bold text-black font-merriweather">
                {title}
            </h2>)}

            <div className="flex justify-end mb-4">
                <Link href={viewMoreHref} className="text-sm text-[#6A38F3] hover:underline">
                    ver mais
                </Link>
            </div>
            <div className="overflow-x-auto pb-4">
                <div className="flex flex-nowrap gap-6">
                    {products.length > 0 ? (
                        products.map(produto => {
                            const avaliacoes: { nota: number }[] = (produto as any).avaliacoes || [];
                            const count = avaliacoes.length;
                            const rating = count > 0 ? avaliacoes.reduce((acc, a) => acc + (a.nota || 0), 0) / count : undefined;
                            return (
                                <div key={produto.id} className="shrink-0 w-64">
                                    <ProductCard key={produto.id} produto={produto} rating={rating} />
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 text-lg">
                            Ops! Nenhum produto foi encontrado nesta categoria.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}