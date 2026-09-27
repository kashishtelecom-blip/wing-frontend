export default function CopyrightPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose">
      <h1>Copyright Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>1. Your Content</h2>
      <p>
        You own the content you post on Wing. By posting, you grant Wing a
        license to display and distribute it on the platform.
      </p>

      <h2>2. Reporting Infringement</h2>
      <p>
        If you believe your copyright has been infringed, use the
        "Report copyright" option on any Wing.
      </p>

      <h2>3. Our Response</h2>
      <p>
        We review reports and may remove content that infringes third-party
        rights.
      </p>

      <h2>4. Repeat Infringers</h2>
      <p>
        Accounts with repeated violations may be suspended or terminated.
      </p>
    </div>
  );
}