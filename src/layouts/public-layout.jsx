import Navbar from "../components/navbar/navbar";
import Footer from "../components/footer/footer";

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default PublicLayout;
