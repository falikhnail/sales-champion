CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: customer_pricing_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_pricing_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    tier_name text NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: price_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    product_name text NOT NULL,
    product_unit text NOT NULL,
    region_name text NOT NULL,
    base_price numeric(12,2) NOT NULL,
    region_price numeric(12,2) NOT NULL,
    discounts jsonb DEFAULT '[]'::jsonb,
    net_price numeric(12,2) NOT NULL,
    margin_amount numeric(12,2) NOT NULL,
    margin_type text NOT NULL,
    final_price numeric(12,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_pricing_tiers customer_pricing_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_pricing_tiers
    ADD CONSTRAINT customer_pricing_tiers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: idx_price_history_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_history_created ON public.price_history USING btree (created_at DESC);


--
-- Name: idx_price_history_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_history_customer ON public.price_history USING btree (customer_id);


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customer_pricing_tiers customer_pricing_tiers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_pricing_tiers
    ADD CONSTRAINT customer_pricing_tiers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: price_history price_history_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customers Allow public delete on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on customers" ON public.customers FOR DELETE USING (true);


--
-- Name: price_history Allow public delete on price_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on price_history" ON public.price_history FOR DELETE USING (true);


--
-- Name: customer_pricing_tiers Allow public delete on pricing tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete on pricing tiers" ON public.customer_pricing_tiers FOR DELETE USING (true);


--
-- Name: customers Allow public insert on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on customers" ON public.customers FOR INSERT WITH CHECK (true);


--
-- Name: price_history Allow public insert on price_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on price_history" ON public.price_history FOR INSERT WITH CHECK (true);


--
-- Name: customer_pricing_tiers Allow public insert on pricing tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert on pricing tiers" ON public.customer_pricing_tiers FOR INSERT WITH CHECK (true);


--
-- Name: customers Allow public read access on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on customers" ON public.customers FOR SELECT USING (true);


--
-- Name: price_history Allow public read access on price_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on price_history" ON public.price_history FOR SELECT USING (true);


--
-- Name: customer_pricing_tiers Allow public read access on pricing tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access on pricing tiers" ON public.customer_pricing_tiers FOR SELECT USING (true);


--
-- Name: customers Allow public update on customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on customers" ON public.customers FOR UPDATE USING (true);


--
-- Name: price_history Allow public update on price_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on price_history" ON public.price_history FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: customer_pricing_tiers Allow public update on pricing tiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update on pricing tiers" ON public.customer_pricing_tiers FOR UPDATE USING (true);


--
-- Name: customer_pricing_tiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_pricing_tiers ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: price_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


