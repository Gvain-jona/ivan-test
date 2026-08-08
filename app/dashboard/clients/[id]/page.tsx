import ClientDetailScreen from '@/components/clients/ClientDetailScreen';

export const metadata = { title: 'Client' };

/** C2 on the Pencil canvas. */
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetailScreen id={id} />;
}
