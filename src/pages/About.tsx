
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("nav.backToHome")}
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-12 text-center">{t("footer.about.title")}</h1>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t("vision.title")}</h2>
              <p className="text-lg text-gray-600 mb-6">{t("vision.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t("mission.title")}</h2>
              <p className="text-lg text-gray-600 mb-6">{t("mission.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t("values.title")}</h2>
              <p className="text-lg text-gray-600 mb-6">{t("values.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t("footer.about.title")}</h2>
              <p className="text-lg text-gray-600 mb-6">{t("footer.about.description")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t("footer.contact.title")}</h2>
              <p className="text-lg text-gray-600">
                Email: <a href="mailto:info@insurancevault.com" className="text-purple-600 hover:text-purple-700">
                  info@insurancevault.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
