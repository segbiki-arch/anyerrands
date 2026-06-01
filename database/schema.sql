--
-- PostgreSQL database dump
--

\restrict wgWhSonFEoXhWMtB9DsID34LMZ6W6V48RBa4dbjmyqsF7PaYGLRwsuGva7RhpDE

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: stripe; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA stripe;


--
-- Name: errand_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.errand_status AS ENUM (
    'open',
    'accepted',
    'completed'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'unpaid',
    'paid',
    'refunded'
);


--
-- Name: report_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_reason AS ENUM (
    'work_not_done',
    'work_poor_quality',
    'no_show',
    'late',
    'other'
);


--
-- Name: report_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_status AS ENUM (
    'pending',
    'reviewed',
    'resolved'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    description text NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: errands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.errands (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    status public.errand_status DEFAULT 'open'::public.errand_status NOT NULL,
    requester_name text NOT NULL,
    requester_location text NOT NULL,
    estimated_duration text,
    budget_amount numeric(10,2),
    helper_id integer,
    helper_name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    payment_status public.payment_status DEFAULT 'unpaid'::public.payment_status NOT NULL,
    paid_amount numeric(10,2),
    platform_fee numeric(10,2),
    payment_intent_id text,
    checkout_session_id text,
    paid_at timestamp without time zone,
    requester_address text,
    requester_phone text,
    trip_from text,
    trip_to text,
    trip_when text,
    passengers integer,
    return_trip boolean DEFAULT false NOT NULL,
    requester_user_id text,
    transfer_id text,
    helper_paid_at timestamp without time zone
);


--
-- Name: errands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.errands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: errands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.errands_id_seq OWNED BY public.errands.id;


--
-- Name: helpers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.helpers (
    id integer NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    bio text NOT NULL,
    skills text[] DEFAULT '{}'::text[] NOT NULL,
    errands_completed integer DEFAULT 0 NOT NULL,
    rating numeric(3,1),
    available boolean DEFAULT true NOT NULL,
    avatar_initials text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    stripe_account_id text,
    user_id text
);


--
-- Name: helpers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.helpers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: helpers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.helpers_id_seq OWNED BY public.helpers.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    helper_id integer,
    errand_id integer NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id text
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    errand_id integer NOT NULL,
    helper_id integer NOT NULL,
    reporter_name text NOT NULL,
    reason public.report_reason NOT NULL,
    description text NOT NULL,
    status public.report_status DEFAULT 'pending'::public.report_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    errand_id integer NOT NULL,
    helper_id integer NOT NULL,
    reviewer_name text NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: errands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errands ALTER COLUMN id SET DEFAULT nextval('public.errands_id_seq'::regclass);


--
-- Name: helpers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers ALTER COLUMN id SET DEFAULT nextval('public.helpers_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: errands errands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errands
    ADD CONSTRAINT errands_pkey PRIMARY KEY (id);


--
-- Name: helpers helpers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers
    ADD CONSTRAINT helpers_pkey PRIMARY KEY (id);


--
-- Name: helpers helpers_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers
    ADD CONSTRAINT helpers_user_id_unique UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_errand_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_errand_id_unique UNIQUE (errand_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: errands errands_helper_id_helpers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errands
    ADD CONSTRAINT errands_helper_id_helpers_id_fk FOREIGN KEY (helper_id) REFERENCES public.helpers(id);


--
-- Name: errands errands_requester_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.errands
    ADD CONSTRAINT errands_requester_user_id_users_id_fk FOREIGN KEY (requester_user_id) REFERENCES public.users(id);


--
-- Name: helpers helpers_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.helpers
    ADD CONSTRAINT helpers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_errand_id_errands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_errand_id_errands_id_fk FOREIGN KEY (errand_id) REFERENCES public.errands(id);


--
-- Name: notifications notifications_helper_id_helpers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_helper_id_helpers_id_fk FOREIGN KEY (helper_id) REFERENCES public.helpers(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reports reports_errand_id_errands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_errand_id_errands_id_fk FOREIGN KEY (errand_id) REFERENCES public.errands(id);


--
-- Name: reports reports_helper_id_helpers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_helper_id_helpers_id_fk FOREIGN KEY (helper_id) REFERENCES public.helpers(id);


--
-- Name: reviews reviews_errand_id_errands_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_errand_id_errands_id_fk FOREIGN KEY (errand_id) REFERENCES public.errands(id);


--
-- Name: reviews reviews_helper_id_helpers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_helper_id_helpers_id_fk FOREIGN KEY (helper_id) REFERENCES public.helpers(id);


--
-- PostgreSQL database dump complete
--

\unrestrict wgWhSonFEoXhWMtB9DsID34LMZ6W6V48RBa4dbjmyqsF7PaYGLRwsuGva7RhpDE

