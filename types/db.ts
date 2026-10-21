// Database types for the Supabase client.
// Regenerate after schema changes with:
//   npx supabase gen types typescript --linked > types/db.ts
// Until the CLI is linked, this file is maintained by hand to match /supabase/migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductMode = "buy" | "whatsapp";
export type SubcategoryKind =
  | "view_all"
  | "manual"
  | "filter_new"
  | "filter_best"
  | "filter_under_1000"
  | "filter_personalised"
  | "content_page";
export type HomepageSectionType =
  | "hero"
  | "collection_carousel"
  | "promo_duo"
  | "product_mosaic"
  | "promo_trio"
  | "instagram_feed"
  | "info_strip";
export type EnquiryType = "customer_support" | "personalised_orders" | "corporate_gifting";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type DispatchStatus = "processing" | "dispatched" | "delivered" | "cancelled";

export type MenuFeatureImage = {
  url: string;
  alt: string;
  label?: string;
  link_url?: string;
};

/**
 * Builds the Row/Insert/Update triple Supabase expects.
 * `Defaults` lists columns that have a database default (optional on insert).
 */
type Table<Row, Defaults extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Defaults> & Partial<Pick<Row, Defaults>>;
  Update: Partial<Row>;
  Relationships: [];
};

// Nullable columns are optional on insert as well.
type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type T<Row, Defaults extends keyof Row = never> = Table<
  Row,
  Defaults | NullableKeys<Row>
>;

export type Database = {
  public: {
    Tables: {
      admins: T<
        { user_id: string; email: string; created_at: string },
        "created_at"
      >;
      categories: T<
        {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          show_in_menu: boolean;
          image_url: string | null;
          description: string | null;
          menu_feature_images: MenuFeatureImage[];
          default_mode: ProductMode;
        },
        "id" | "sort_order" | "show_in_menu" | "menu_feature_images" | "default_mode"
      >;
      subcategories: T<
        {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          sort_order: number;
          kind: SubcategoryKind;
          description: string | null;
        },
        "id" | "sort_order" | "kind"
      >;
      products: T<
        {
          id: string;
          name: string;
          slug: string;
          short_description: string | null;
          description_html: string | null;
          details_html: string | null;
          price_inr: number | null;
          compare_at_price_inr: number | null;
          sku: string | null;
          stock_qty: number | null;
          track_stock: boolean;
          mode: ProductMode;
          badge_text: string | null;
          is_new: boolean;
          is_best_seller: boolean;
          low_stock_message: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "track_stock"
        | "mode"
        | "is_new"
        | "is_best_seller"
        | "is_active"
        | "sort_order"
        | "created_at"
        | "updated_at"
      >;
      product_images: T<
        { id: string; product_id: string; url: string; alt: string; sort_order: number },
        "id" | "alt" | "sort_order"
      >;
      product_variants: T<
        {
          id: string;
          product_id: string;
          label: string;
          option_group: string;
          price_override: number | null;
          stock_qty: number | null;
          sort_order: number;
        },
        "id" | "option_group" | "sort_order"
      >;
      product_subcategories: T<{ product_id: string; subcategory_id: string }>;
      site_settings: T<
        { key: string; value: Json; updated_at: string },
        "value" | "updated_at"
      >;
      pages: T<
        {
          slug: string;
          title: string;
          body_html: string;
          cta_whatsapp_message: string | null;
          cta_email_subject: string | null;
          cta_label: string | null;
          effective_date: string | null;
          /** Guided enquiry form (Custom Orders / Corporate Gifting); see lib/enquiry-forms.ts. */
          form_config: Json;
          updated_at: string;
        },
        "body_html" | "form_config" | "updated_at"
      >;
      faqs: T<
        {
          id: string;
          group_name: string;
          question: string;
          answer_html: string;
          sort_order: number;
          is_active: boolean;
        },
        "id" | "sort_order" | "is_active"
      >;
      homepage_sections: T<
        {
          id: string;
          type: HomepageSectionType;
          sort_order: number;
          is_active: boolean;
          config: Json;
        },
        "id" | "sort_order" | "is_active" | "config"
      >;
      homepage_assets: T<
        {
          id: string;
          section_id: string;
          slot: number;
          image_url: string | null;
          /** Optional phone version of image_url (homepage art direction). */
          mobile_image_url: string | null;
          image_alt: string;
          link_url: string | null;
          heading: string | null;
          subheading: string | null;
          button_label: string | null;
          badge_text: string | null;
          sort_order: number;
        },
        "id" | "slot" | "image_alt" | "sort_order"
      >;
      orders: T<
        {
          id: string;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address_line1: string;
          shipping_address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          notes: string | null;
          subtotal_inr: number;
          shipping_inr: number;
          total_inr: number;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          payment_status: PaymentStatus;
          dispatch_status: DispatchStatus;
          tracking_details: string | null;
          courier_name: string | null;
          access_token: string;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "order_number"
        | "access_token"
        | "shipping_inr"
        | "payment_status"
        | "dispatch_status"
        | "created_at"
        | "updated_at"
      >;
      order_items: T<
        {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_label: string | null;
          unit_price_inr: number;
          qty: number;
          image_url: string | null;
        },
        "id"
      >;
      enquiries: T<
        {
          id: string;
          enquiry_type: EnquiryType;
          name: string;
          email: string;
          phone: string | null;
          order_number: string | null;
          message: string;
          details: Json;
          status: "new" | "in_progress" | "closed";
          created_at: string;
        },
        "id" | "details" | "status" | "created_at"
      >;
      rate_limits: T<
        { key: string; window_start: string; hits: number },
        "window_start" | "hits"
      >;
      razorpay_events: T<
        { id: string; event_id: string; payload: Json; created_at: string },
        "id" | "created_at"
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      next_order_number: { Args: Record<string, never>; Returns: string };
      mark_order_paid: { Args: { p_order_id: string; p_payment_id: string | null }; Returns: boolean };
      check_rate_limit: { Args: { p_key: string; p_max: number; p_window_seconds: number }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<K extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][K]["Row"];
export type TablesInsert<K extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][K]["Insert"];
export type TablesUpdate<K extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][K]["Update"];
