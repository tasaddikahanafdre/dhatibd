import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal = 0, items = [] } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code' }, { status: 400 });
    }

    const coupon = await db.getCouponByCode(code.trim());
    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Invalid coupon code' }, { status: 404 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, message: 'This coupon is no longer active' }, { status: 400 });
    }

    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return NextResponse.json({ valid: false, message: `This coupon will become active on ${new Date(coupon.start_date).toLocaleDateString()}` }, { status: 400 });
    }

    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return NextResponse.json({ valid: false, message: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, message: 'This coupon has reached its maximum usage limit' }, { status: 400 });
    }

    const numericSubtotal = Number(subtotal) || 0;
    if (coupon.min_order_amount && numericSubtotal < coupon.min_order_amount) {
      return NextResponse.json({ 
        valid: false, 
        message: `Minimum order amount of ৳${coupon.min_order_amount.toLocaleString()} required for this coupon` 
      }, { status: 400 });
    }

    // Check product / category restrictions if items provided
    let qualifyingSubtotal = numericSubtotal;
    if ((coupon.applicable_category_ids && coupon.applicable_category_ids.length > 0) ||
        (coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0)) {
      if (Array.isArray(items) && items.length > 0) {
        qualifyingSubtotal = items.reduce((sum: number, item: any) => {
          const prodId = item.product_id || item.product?.id || item.id;
          const catId = item.category_id || item.product?.category_id;
          
          const matchProd = coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0
            ? coupon.applicable_product_ids.includes(prodId)
            : true;
          
          const matchCat = coupon.applicable_category_ids && coupon.applicable_category_ids.length > 0
            ? (catId && coupon.applicable_category_ids.includes(catId))
            : true;

          if (matchProd && matchCat) {
            const price = Number(item.deal_info?.deal_price || item.product_price || item.product?.price || 0);
            const qty = Number(item.quantity || 1);
            return sum + (price * qty);
          }
          return sum;
        }, 0);

        if (qualifyingSubtotal <= 0) {
          return NextResponse.json({
            valid: false,
            message: 'This coupon does not apply to any products in your cart'
          }, { status: 400 });
        }
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((qualifyingSubtotal * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = Math.min(qualifyingSubtotal, coupon.discount_value);
    }

    return NextResponse.json({
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discountAmount,
      message: `Coupon "${coupon.code}" applied! You saved ৳${discountAmount.toLocaleString()}`
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: error.message || 'Error validating coupon' }, { status: 500 });
  }
}
