const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      {/* <div className="footer-left">
        <strong>Hospital Learning Portal</strong>

        <span>
          Training & Employee Development
        </span>
      </div> */}

      <div className="footer-center">
        © {currentYear} Hospital Learning Portal
      </div>

      <div className="footer-right">
        <span>Powered by Arghya Dey</span>

        <span>Version 1.0.0</span>
      </div>
    </footer>
  );
};

export default Footer;