// src/app/maintenance/page.tsx
import { Wrench, Clock, Mail, AlertTriangle } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karbantartás | Lovas Zoltán György",
  description: "Az oldal jelenleg karbantartás alatt áll. Kérjük, látogasson vissza később.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Maintenance Icon */}
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-6 animate-pulse">
            <Wrench className="h-12 w-12 text-yellow-600 dark:text-yellow-400 animate-bounce" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Karbantartás alatt
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Az oldal jelenleg karbantartás alatt áll a jobb szolgáltatás érdekében. 
          Hamarosan visszatérünk frissített tartalommal és új funkciókkal.
        </p>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Várható időtartam
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              A karbantartás várhatóan 2-4 órát vesz igénybe
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sürgős esetben
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Kérjük, használja az alábbi elérhetőségeket
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Sürgős ügyekben</h2>
          <div className="space-y-2">
            <p className="text-blue-100">
              <strong>Email:</strong> info@lovaszoltan.hu
            </p>
            <p className="text-blue-100">
              <strong>Telefon:</strong> +36 (XX) XXX-XXXX
            </p>
          </div>
        </div>

        {/* What We're Working On */}
        <div className="text-left bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Mit fejlesztünk?
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-3 mr-4"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Teljesítmény optimalizálás</h3>
                <p className="text-gray-600 dark:text-gray-400">Gyorsabb oldalbetöltés és jobb felhasználói élmény</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-3 mr-4"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Biztonsági frissítések</h3>
                <p className="text-gray-600 dark:text-gray-400">A legújabb biztonsági szabványok alkalmazása</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-3 mr-4"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Új funkciók</h3>
                <p className="text-gray-600 dark:text-gray-400">Interaktívabb tartalom és jobb navigáció</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Social Links */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Kövessen minket a közösségi médiában a legfrissebb hírekért:
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://facebook.com/lovaszoltan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              Facebook
            </a>
            <a
              href="https://twitter.com/lovaszoltan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-200 transition-colors duration-200"
            >
              Twitter
            </a>
            <a
              href="mailto:info@lovaszoltan.hu"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
            >
              Email
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Köszönjük türelmét! Az oldal hamarosan elérhető lesz.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Utolsó frissítés: {new Date().toLocaleString('hu-HU')}
          </p>
        </div>
      </div>
    </div>
  );
}