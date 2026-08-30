// FarmEazy i18n setup
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    te: {
      translation: {
        "Dashboard": "డాష్‌బోర్డ్",
        "Welcome": "స్వాగతం! ఇది మీ ఫార్మ్ అవలోకనం.",
        "Total Farms": "మొత్తం ఫార్మ్స్",
        "Total Crops": "మొత్తం పంటలు",
        "Products Listed": "జాబితా ఉత్పత్తులు",
        "Active Alerts": "క్రియాశీల అలర్ట్స్",
        "Quick Actions": "త్వరిత చర్యలు",
        "View Farms": "ఫార్మ్స్ చూడండి",
        "Manage Crops": "పంటలు నిర్వహించండి",
        "Schedule Irrigation": "పారుదల షెడ్యూల్ చేయండి",
        "Generate Report": "రిపోర్ట్ రూపొందించండి",
        "Recent Activities": "ఇటీవలి కార్యకలాపాలు",
        "Getting Started": "ప్రారంభించండి"
      }
    },
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Welcome": "Welcome! Here is your farm overview.",
      "Total Farms": "Total Farms",
      "Total Crops": "Total Crops",
      "Products Listed": "Products Listed",
      "Active Alerts": "Active Alerts",
      "Quick Actions": "Quick Actions",
      "View Farms": "View Farms",
      "Manage Crops": "Manage Crops",
      "Schedule Irrigation": "Schedule Irrigation",
      "Generate Report": "Generate Report",
      "Recent Activities": "Recent Activities",
      "Getting Started": "Getting Started"
    }
  },
  hi: {
    translation: {
      "Dashboard": "डैशबोर्ड",
      "Welcome": "स्वागत है! यहाँ आपकी फार्म की जानकारी है।",
      "Total Farms": "कुल फार्म",
      "Total Crops": "कुल फसलें",
      "Products Listed": "सूचीबद्ध उत्पाद",
      "Active Alerts": "सक्रिय अलर्ट",
      "Quick Actions": "त्वरित क्रियाएँ",
      "View Farms": "फार्म देखें",
      "Manage Crops": "फसलें प्रबंधित करें",
      "Schedule Irrigation": "सिंचाई अनुसूची",
      "Generate Report": "रिपोर्ट बनाएं",
      "Recent Activities": "हाल की गतिविधियाँ",
      "Getting Started": "शुरुआत करें"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
