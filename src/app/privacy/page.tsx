export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Information We Collect</h2>
      <p>
        Wing collects account information (email, username, name), content you
        post, and basic usage data to operate the service.
      </p>

      <h2>2. How We Use It</h2>
      <p>
        We use your information to run Wing — authentication, delivering your
        feed, notifications, and improving the product. We do not sell your
        data.
      </p>

      <h2>3. Data Storage</h2>
      <p>
        Data is stored in MongoDB Atlas. Passwords are hashed using bcrypt.
        Sessions use JWT tokens.
      </p>

      <h2>4. Your Rights</h2>
      <p>
        You can export your data (Settings → Export) or deactivate your account
        at any time.
      </p>

      <h2>5. Contact</h2>
      <p>Questions? Email support@wing.app</p>
    </div>
  );
}