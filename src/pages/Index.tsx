import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, FileText, Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex justify-between items-center p-4">
        <Link to="/" className="flex flex-col">
          <span className="text-3xl font-bold tracking-wider">WISESTEIN</span>
          <span className="text-[#4ADE80] text-sm">Supply Chain Management At Its Best.</span>
        </Link>
        <div className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link to="/login">Kirjaudu sisään</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-6">
          AI Kysyntäennuste<span className="text-[#4ADE80]">avustaja</span>
        </h1>
        <p className="text-xl mb-4">
          Ennusta kysyntää tuotteille, joilla ei ole riittävää tilastollista dataa.
        </p>
        <p className="text-xl mb-8">
          Tehosta ostoprosessiasi ja paranna varastonhallintaa älykkään kysynnän ennusteen avulla.
        </p>
        <Button 
          className="bg-[#4ADE80] hover:bg-[#22C55E] text-white px-8 py-6 rounded-lg text-lg"
          onClick={() => window.open('https://wisestein.fi/yhteystiedot', '_blank', 'noopener,noreferrer')}
        >
          Varaa esittely
        </Button>

        <section className="mt-24">
          <h2 className="text-3xl font-bold mb-12">Älykkäämpi tapa ennustaa kysyntää</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-[#4ADE80]/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-xl font-semibold">Tekoälyavusteinen ennustaminen</h3>
                <p className="text-gray-600">
                  Hyödynnä edistynyttä tekoälyä tuotteiden kysynnän ennustamiseen, erityisesti kun tilastollista dataa on vähän.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-[#4ADE80]/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-xl font-semibold">Dokumentoi ja opi</h3>
                <p className="text-gray-600">
                  Tallenna vaikeat päätösongelmat ja väärät mitoitukset. Hae helposti arkistosta aiemmat tapaukset ja nopeuta oppimista.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-[#4ADE80]/10 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-[#4ADE80]" />
                </div>
                <h3 className="text-xl font-semibold">Syvähaku signaaleista</h3>
                <p className="text-gray-600">
                  Löydä automaattisesti kaikki tuotteesi kysyntään vaikuttavat uutiset ja signaalit internetistä. Tee tietoon perustuvia päätöksiä.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6">
            Ota käyttöön <span className="text-[#4ADE80]">tekoälyavusteinen ennustaminen</span>
          </h2>
          <div className="flex justify-center gap-4">
            <Button 
              className="bg-[#4ADE80] hover:bg-[#22C55E] text-white px-8 py-6 rounded-lg text-lg"
              onClick={() => window.open('https://wisestein.fi/yhteystiedot', '_blank', 'noopener,noreferrer')}
            >
              Varaa esittely
            </Button>
            <Button 
              variant="outline" 
              className="px-8 py-6 rounded-lg text-lg"
              asChild
            >
              <Link to="/login">Kirjaudu sisään →</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Palvelut</h3>
              <ul className="space-y-2">
                <li><a href="https://wisestein.fi/palvelut/#koulutuspalvelut" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Koulutuspalvelut</a></li>
                <li><a href="https://wisestein.fi/palvelut/#konsultointipalvelut" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Konsultointipalvelut</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Ratkaisut</h3>
              <ul className="space-y-2">
                <li><a href="https://wisestein.fi/ratkaisut/myynnille" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Myynnille</a></li>
                <li><a href="https://wisestein.fi/ratkaisut/ostolle" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Ostolle</a></li>
                <li><a href="https://wisestein.fi/ratkaisut/#markkinoinnille" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Markkinoinnille</a></li>
                <li><a href="https://wisestein.fi/ratkaisut/valmistukselle" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Valmistukselle</a></li>
                <li><a href="https://wisestein.fi/ratkaisut/taloushallinnolle" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Taloushallinnolle</a></li>
                <li><a href="https://wisestein.fi/ratkaisut/logistiikalle" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Logistiikalle</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Yritys</h3>
              <ul className="space-y-2">
                <li><a href="https://wisestein.fi/yritys#historia" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Historia</a></li>
                <li><a href="https://wisestein.fi/yritys#tiimi" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Tiimi</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Yhteystiedot</h3>
              <ul className="space-y-2">
                <li><a href="https://wisestein.fi/yhteystiedot#toimistomme" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Toimistomme</a></li>
                <li><a href="https://wisestein.fi/yhteystiedot#asiakastuki" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Asiakastuki</a></li>
                <li><a href="https://wisestein.fi/yhteystiedot#laskutus" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Laskutus</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600">© {new Date().getFullYear()} Wisestein. Kaikki oikeudet pidätetään.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
