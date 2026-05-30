import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Features from "@/components/Features";
import OrderForm from "@/components/OrderForm";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark">
      <Navbar />
      <Hero />
      <Services />
      <Pricing />
      <Features />
      <OrderForm />
      <Reviews />
      <Footer />
    </main>
  );
}
