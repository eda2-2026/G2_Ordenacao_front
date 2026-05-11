'use client';

import { useState, useEffect, use, useMemo } from "react";
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';

import api from "@/utilis/api";
import SearchBar, { SuggestionItem } from '@/components/ui/SearchBar';
import StoreList from "@/components/ui/StoreList";
import { ProductRow, ProdutoParaCard } from "@/components/ProductRow";
import SortDropdown, { SortOption } from "@/components/ui/SortDropdown";
import { mergeSort, comparadorPorAvaliacao } from "@/utilis/sorting";
import FiltroSubcategoriaModal from "../../../components/ModalFilterSub";
import { ArvoreBusca } from "@/utilis/Trie";
interface CategoriaPageProps {
  params: Promise<{ categoriaSlug: string; }>;
}

// Configuração de conteúdo do Header por categoria
const headerContent: Record<string, { titleLine1: string; titleLine2: string; image: string }> = {
  mercado: {
    titleLine1: "Qualidade e frescor",
    titleLine2: "para sua despensa",
    image: "/mercado-mascote.png"
  },
  farmacia: {
    titleLine1: "Saúde e cuidados",
    titleLine2: "ao seu alcance",
    image: "/farmacia-mascote.png"
  },
  beleza: {
    titleLine1: "Realce sua beleza",
    titleLine2: "com os melhores produtos",
    image: "/beleza-mascote.png"
  },
  moda: {
    titleLine1: "Seu estilo, suas regras",
    titleLine2: "vista-se bem",
    image: "/moda-mascote.png"
  },
  eletronicos: {
    titleLine1: "O universo da tecnologia",
    titleLine2: "em um só lugar",
    image: "/eletronicos-mascote.png"
  },
  jogos: {
    titleLine1: "Diversão garantida",
    titleLine2: "para os players",
    image: "/jogos-mascote.png"
  },
  brinquedos: {
    titleLine1: "Imaginação e alegria",
    titleLine2: "para os pequenos",
    image: "/brinquedos-mascote.png"
  },
  casa: {
    titleLine1: "Tudo para o seu lar",
    titleLine2: "com conforto e estilo",
    image: "/casa-mascote.png"
  },
};

export default function CategoriaPage({ params }: CategoriaPageProps) {
  const resolvedParams = use(params);
  const categoriaAtual = resolvedParams.categoriaSlug;

  const activeHeader = headerContent[categoriaAtual];

  const [maisAvaliados, setMaisAvaliados] = useState<ProdutoParaCard[]>([]);
  const [recemAdicionados, setRecemAdicionados] = useState<ProdutoParaCard[]>([]);
  const [eletronicosProdutos, setEletronicosProdutos] = useState<ProdutoParaCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(5);

  // Estados de Busca
  const [searchResults, setSearchResults] = useState<ProdutoParaCard[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Ordenação e Filtro
  const [currentSort, setCurrentSort] = useState<SortOption>('id');
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);
  const arvoreDeProdutos = useMemo(() => {
    return new ArvoreBusca();
  }, []);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      clearSearch();
      return;
    }

    setSelectedSubcategory(null);
    setIsSearching(true);

    const resultados = arvoreDeProdutos.buscar(term);
    setSearchResults(resultados);
    setIsSearching(false);
  };

  const handleFetchSuggestions = (term: string): SuggestionItem[] => {
    if (!term.trim()) return [];
    try {
      const resultados = arvoreDeProdutos.buscar(term).slice(0, 5);
      return resultados.map((prod: ProdutoParaCard) => ({
        id: prod.id,
        nome: prod.nome,
        imagem: prod.imagens?.[0]?.urlImagem,
        tipo: 'produto'
      }));
    } catch (error) {
      return [];
    }
  };

  const handleFilterChange = (id: number | null) => {
    setSelectedSubcategory(id);
    setCurrentPage(1);

    if (searchTerm || searchResults !== null) {
      clearSearch();
    }
  };

  useEffect(() => {
    if (searchResults !== null) {
      setIsLoading(false);
      return;
    }

    const buscarDadosDaPagina = async () => {
      try {
        setIsLoading(true);

        let urlPrincipal = `/produtos/categoria/${categoriaAtual}?page=${currentPage}&limit=${limit}&ordenar=${currentSort}`;

        if (selectedSubcategory !== null) {
          urlPrincipal += `&subcategoriaId=${selectedSubcategory}`;
        }

        const promisePrincipal = api.get(urlPrincipal);

        const promiseMaisAvaliados = api.get(`/produtos/ver-mais/${categoriaAtual}?limit=50`);

        const promiseRecentes = api.get(`/produtos/ver-mais/${categoriaAtual}?limit=10&ordenar=recentes`);

        const [responsePrincipal, responseAvaliados, responseRecentes] = await Promise.all([
          promisePrincipal,
          promiseMaisAvaliados,
          promiseRecentes
        ]);

        const dadosPrincipal = responsePrincipal.data;
        const listaProdutos = dadosPrincipal.produtos || [];
        const total = dadosPrincipal.totalCount || 0;

        setEletronicosProdutos(listaProdutos);
        setTotalPages(Math.ceil(total / limit));

        let candidatos = Array.isArray(responseAvaliados.data) ? responseAvaliados.data : responseAvaliados.data.produtos || [];

        const somenteAvaliados = candidatos.filter((p: ProdutoParaCard) => (p.avaliacoes?.length || 0) > 0);
        const listaOrdenadaPorNota = mergeSort(somenteAvaliados, comparadorPorAvaliacao);
        setMaisAvaliados(listaOrdenadaPorNota.slice(0, 10));

        const listaRecentes = Array.isArray(responseRecentes.data)
          ? responseRecentes.data
          : responseRecentes.data.produtos || [];
        setRecemAdicionados(listaRecentes);

        const todosOsProdutos = [
          ...listaProdutos,
          ...listaOrdenadaPorNota.slice(0, 10),
          ...listaRecentes
        ];

        // um produto pode ser recente e bem avaliado ao mesmo tempo
        const produtosUnicos = Array.from(new Map(todosOsProdutos.map(p => [p.id, p])).values());

        produtosUnicos.forEach(produto => {
          arvoreDeProdutos.inserir(produto);
        });

        if (typeof window !== "undefined") {
          (window as any).arvoreCategoria = arvoreDeProdutos;
        }
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    buscarDadosDaPagina();

  }, [searchResults, currentPage, limit, currentSort, selectedSubcategory, categoriaAtual]);

  const dataToDisplay = searchResults || eletronicosProdutos;
  const isDisplayingSearch = searchResults !== null;

  let title = "";
  if (isDisplayingSearch) {
    title = `Resultados da Busca`;
  } else if (selectedSubcategory) {
    title = "Produtos Filtrados";
  }

  if (isLoading) {
    return (
      <main className="text-center p-8 bg-[#FDF9F2] min-h-screen">
        <Navbar />
        <p className="text-gray-500 text-lg mt-20">Carregando produtos...</p>
      </main>
    );
  }

  return (
    <main className="bg-[#FDF9F2] min-h-screen">

      <header className="w-full bg-black relative overflow-hidden -mt-px pt-px">
        <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-black" />
        <Navbar />

        <section className="w-full h-[45vh] flex items-center">
          <div className="w-full max-w-7xl mx-auto px-8 flex items-center h-full">
            <div className="text-white ">
              <h1 className="text-7xl font-bold leading-tight">
                {activeHeader.titleLine1}
              </h1>
              <h1 className="text-7xl font-bold leading-tight ml-70">
                {activeHeader.titleLine2}
              </h1>
            </div>
            <div className="absolute bottom-0 right-8 w-235 h-150 -mb-50">
              <img
                src={activeHeader.image}
                alt={`Mascote ${categoriaAtual}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </section>
      </header>

      <div className="max-w-[1440px] mx-auto px-8 mb-15 w-full grow">

        <section className="py-8 flex flex-col md:flex-row justify-between items-center gap-6">

          <div className="w-full md:w-auto flex-1 overflow-hidden">
            <FiltroSubcategoriaModal
              categoriaLoja={categoriaAtual}
              selectedId={selectedSubcategory}
              onSelect={handleFilterChange}
            />
          </div>

          {/* Lado Direito: Busca e Ordenação */}
          <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
            <SearchBar
              className="w-full md:w-80"
              onSearch={handleSearch}
              placeholder="Procurar por..."
              fetchSuggestions={handleFetchSuggestions}
            />

            {!isDisplayingSearch && (
              <SortDropdown
                currentSort={currentSort}
                onSortChange={setCurrentSort}
              />
            )}
          </div>

        </section>

        {!isDisplayingSearch && title && (
          title !== "" && title !== "Produtos Filtrados" && (
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
            </h2>
          )
        )}

        {isSearching ? (
          <div className="py-12 text-center col-span-full">
            <p className="text-gray-500">Buscando resultados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 mb-0">
            {dataToDisplay.length > 0 ? (
              dataToDisplay.map(produto => {
                const imageUrl = produto.imagens?.[0]?.urlImagem || '/Stock.io.png';
                const badgeUrl = produto.loja?.logo || undefined;
                return (
                  <ProductCard
                    id={produto.id}
                    key={produto.id}
                    name={produto.nome}
                    price={produto.preco.toString()}
                    isAvailable={produto.estoque > 0}
                    imageUrl={imageUrl}
                    badgeUrl={badgeUrl}
                  />
                );
              })
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <p className="text-gray-500 text-lg mb-2">
                  {isDisplayingSearch
                    ? `Nenhum produto encontrado para "${searchTerm}".`
                    : 'Nenhum produto encontrado com os filtros atuais.'
                  }
                </p>
                {selectedSubcategory && (
                  <button
                    onClick={() => handleFilterChange(null)}
                    className="text-[#6A38F3] font-medium hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!isDisplayingSearch && totalPages > 1 && (
          <section className="flex justify-center items-center space-x-2 py-2 mb-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`transition-all duration-200 font-light leading-none px-5 ${currentPage === pageNumber
                  ? 'text-5xl text-black font-normal'
                  : 'text-3xl text-[#171918]/60 hover:text-[#171918]'
                  }`}
              >
                {pageNumber}
              </button>
            ))}
          </section>
        )}
      </div>

      {/*Lojas, Melhores Avaliados, Recentes */}
      {!isDisplayingSearch && (
        <>
          <div className="w-full h-[430px] bg-black py-10 mt-auto">
            <div className="max-w-[1440px] mx-auto px-8">
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-4xl font-500 text-white">
                  Principais Lojas
                </h2>
              </div>
              <StoreList categoria={categoriaAtual.toUpperCase()} />
            </div>
          </div>
          <section className="pb-0 max-w-[1440px] mx-auto px-8 py-12">
            <div className="flex justify-between items-center mb-0">
              <div className="flex items-baseline gap-1">
                <h2 className="text-4xl font-500 text-[#171918]">Melhores Avaliados</h2>
              </div>
            </div>
            <ProductRow
              title=""
              products={maisAvaliados}
              viewMoreHref={`/ver-mais/${categoriaAtual}`}
            />
          </section>

          <section className="pb-8 max-w-[1440px] mx-auto px-8 py-0">
            <div className="flex justify-between items-center mb-0">
              <div className="flex items-baseline gap-1">
                <h2 className="text-4xl font-500 text-[#171918]">Recém adicionados</h2>
              </div>
            </div>
            <ProductRow title="" products={recemAdicionados} viewMoreHref={`/ver-mais/${categoriaAtual}`} />
          </section>
        </>
      )}
    </main>
  );
}