import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, invoice_generated_at')
      .eq('id', orderId)
      .single();

    if (fetchError) return handleSupabaseError(fetchError);

    if (!order.invoice_generated_at) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ invoice_generated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) return handleSupabaseError(updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
