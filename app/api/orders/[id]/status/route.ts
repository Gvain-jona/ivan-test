import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, handleSupabaseError, handleUnexpectedError } from '@/lib/api/error-handler';
import { UpdateOrderStatusSchema } from '@/lib/orders/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return handleApiError('VALIDATION_ERROR', 'Order ID is required');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return handleApiError('UNAUTHORIZED', 'Authentication required');

    const body = await request.json();
    const parsed = UpdateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return handleApiError('VALIDATION_ERROR', 'Invalid status value', parsed.error.flatten());
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    return handleUnexpectedError(error);
  }
}
