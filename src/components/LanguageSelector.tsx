
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const languages = [
  { code: "en", name: "English", path: "/" },
  { code: "da", name: "Dansk", path: "/da" },
  { code: "fi", name: "Suomi", path: "/fi" },
  { code: "no", name: "Norsk", path: "/no" },
  { code: "sv", name: "Svenska", path: "/sv" },
  { code: "et", name: "Eesti", path: "/et" },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (langCode: string, path: string) => {
    i18n.changeLanguage(langCode);
    navigate(path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code, lang.path)}
            className="cursor-pointer"
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
