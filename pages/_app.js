import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Vegetarian Meal Planner — Free Weekly Indian Diet Plan</title>
        <meta
          name="description"
          content="Get a free personalized Indian vegetarian weekly meal plan — no onion, no garlic, low oil. Tell us your goal and household, get your plan."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Karla:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
