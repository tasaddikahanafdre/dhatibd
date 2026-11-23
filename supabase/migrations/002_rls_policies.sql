-- =============================================================================
-- DREGITAL COMMERCE: ROW LEVEL SECURITY POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Read Policies for Storefront
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Product images are viewable by everyone" 
ON public.product_images FOR SELECT USING (true);

CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Brands are viewable by everyone" 
ON public.brands FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Banners are viewable by everyone" 
ON public.banners FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Delivery zones are viewable by everyone" 
ON public.delivery_zones FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Store settings are viewable by everyone" 
ON public.store_settings FOR SELECT USING (true);

CREATE POLICY "Pages are viewable by everyone" 
ON public.pages FOR SELECT USING (is_published = true OR is_admin(auth.uid()));

CREATE POLICY "Approved reviews are viewable by everyone" 
ON public.product_reviews FOR SELECT USING (is_approved = true OR is_admin(auth.uid()));

-- Profile Policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Address Policies
CREATE POLICY "Users can manage own addresses" 
ON public.addresses FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Cart & Wishlist Policies
CREATE POLICY "Users can manage own cart" 
ON public.carts FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can manage own cart items" 
ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()) 
    OR is_admin(auth.uid())
);

CREATE POLICY "Users can manage own wishlist" 
ON public.wishlists FOR ALL USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Orders Policies
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT USING (auth.uid() = customer_id OR is_admin(auth.uid()));

CREATE POLICY "Anyone can create an order" 
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items viewable by owner or admin" 
ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR is_admin(auth.uid())))
);

CREATE POLICY "Anyone can insert order items on order placement" 
ON public.order_items FOR INSERT WITH CHECK (true);

-- Contact messages
CREATE POLICY "Anyone can submit a contact message" 
ON public.contact_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view and manage contact messages" 
ON public.contact_messages FOR ALL USING (is_admin(auth.uid()));

-- Admin Full Access Policies for Store Administration
CREATE POLICY "Admins have full access to categories" 
ON public.categories FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to products" 
ON public.products FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to product_images" 
ON public.product_images FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to product_variants" 
ON public.product_variants FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to orders" 
ON public.orders FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to order_items" 
ON public.order_items FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to banners" 
ON public.banners FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to store_settings" 
ON public.store_settings FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to pages" 
ON public.pages FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins have full access to delivery_zones" 
ON public.delivery_zones FOR ALL USING (is_admin(auth.uid()));
