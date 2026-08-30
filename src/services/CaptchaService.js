const SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
const SCRIPT_ID = 'recaptcha-v3-script';
const SCRIPT_SRC = SITE_KEY
  ? `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`
  : null;

let scriptPromise = null;

function loadScript() {
  if (!SITE_KEY) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Captcha can only be executed in a browser environment'));
    }

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      if (window.grecaptcha && window.grecaptcha.ready) {
        return resolve();
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script')));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

const CaptchaService = {
  isEnabled() {
    return !!SITE_KEY;
  },

  async getToken(action = 'submit') {
    if (!SITE_KEY) {
      return null;
    }

    await loadScript();

    if (!window.grecaptcha || !window.grecaptcha.ready || !window.grecaptcha.execute) {
      throw new Error('reCAPTCHA is not available in this browser');
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(SITE_KEY, { action })
          .then((token) => {
            if (!token || typeof token !== 'string' || token.length === 0) {
              return reject(new Error('Failed to obtain reCAPTCHA token'));
            }
            resolve(token);
          })
          .catch((error) => reject(new Error(`reCAPTCHA execution failed: ${error?.message || error}`)));
      });
    });
  },
};

export default CaptchaService;
