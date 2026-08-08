import ProductDetailScreen from '@/components/products/ProductDetailScreen';

export const metadata = { title: 'Product' };

/** D2 on the Pencil canvas. */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailScreen id={id} />;
}
