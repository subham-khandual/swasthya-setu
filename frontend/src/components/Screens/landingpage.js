import React from "react";
import landingpageimage1 from "../assets/Swasthya setu.gif";

function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="hero text-white text-center py-5"
        style={{
          backgroundColor: "#1b558b",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container position-relative z-index-1">
          <h1 className="display-3 font-weight-bold mb-4">Smart Healthcare System</h1>
          {/* Image with custom styling */}
          <img
            src={landingpageimage1}
            alt="Smart Healthcare"
            className="img-fluid rounded mb-4"
            loading="lazy"
            decoding="async"
            style={{
              width: "80vw", // Set width to 80% of the viewport width
              height: "auto", // Maintain aspect ratio
              objectFit: "cover",
              borderRadius: "10px",
            }}
          />
          <p className="lead mb-4">
            Revolutionizing Healthcare with Technology for Better Access to
            Medical Services Anytime, Anywhere
          </p>
        </div>
      </section>

      {/* Blood Donation System Section */}
      <section className="blood-donation py-5">
        <div className="container">
          <h2 className="text-center mb-5 section-title">Blood Donation & Collection System</h2>
          <div className="row">
            {/* Blood Donation */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-lg border-0 rounded-3 card-custom">
                <div className="card-header text-center" style={{ backgroundColor: "#1b558b", color: "white" }}>
                  <h4>Donate Blood</h4>
                </div>
                <div className="card-body text-center">
                  <p>
                    Donating blood is a simple act that can save lives. Join
                    our network of donors and help those in need. Register and
                    give blood to support patients in hospitals.
                  </p>
                </div>
              </div>
            </div>

            {/* Blood Collection */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-lg border-0 rounded-3 card-custom">
                <div className="card-header text-center" style={{ backgroundColor: "#1b558b", color: "white" }}>
                  <h4>Request Blood</h4>
                </div>
                <div className="card-body text-center">
                  <p>
                    In urgent need of blood? Our platform connects you with
                    available blood donors in your area to ensure timely
                    delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Accident Response */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-lg border-0 rounded-3 card-custom">
                <div className="card-header text-center" style={{ backgroundColor: "#1b558b", color: "white" }}>
                  <h4>Report an Accident</h4>
                </div>
                <div className="card-body text-center">
                  <p>
                    Witness an accident? Report it instantly, and get immediate
                    medical response from doctors and ambulance teams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accident Detection Section */}
      <section className="accident-detection py-5 bg-light">
        <div className="container text-center">
          <h2 className="mb-4 section-title">Accident Detection & Medical Response</h2>
          <p className="section-description">
            With real-time accident detection and alert system, help is always
            a click away. If you witness an accident or face an emergency, simply
            send an alert, and our doctors and ambulances will rush to the scene.
          </p>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works py-5">
        <div className="container">
          <h2 className="text-center mb-5 section-title">How It Works</h2>
          <div className="row">
            {/* Blood Donation Process */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-lg border-0 rounded-3 card-custom">
                <div className="card-body text-center">
                  <h5 className="font-weight-bold">Step 1: Register as Donor</h5>
                  <p>
                    Sign up and complete the registration process to become a
                    registered blood donor.
                  </p>
                </div>
              </div>
            </div>

            {/* Blood Request Process */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-lg border-0 rounded-3 card-custom">
                <div className="card-body text-center">
                  <h5 className="font-weight-bold">Step 2: Blood Collection</h5>
                  <p>
                    Blood collection centers are always ready to collect your
                    donation. We will notify you about nearby donation centers.
                  </p>
                </div>
              </div>
            </div>

            {/* Accident Response */}
            <div className="col-md-4 mb-4">
              <div className="card shadow-lg border-0 rounded-3 card-custom">
                <div className="card-body text-center">
                  <h5 className="font-weight-bold">Step 3: Immediate Medical Response</h5>
                  <p>
                    Report an accident, and get immediate response from doctors
                    and ambulance teams on the way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta text-white text-center py-5" style={{ backgroundColor: "#1b558b" }}>
        <div className="container">
          <h2 className="font-weight-bold mb-4">Join the Revolution of Smart Healthcare!</h2>
          <p>
            Experience seamless healthcare services with advanced technology
            for blood donation, blood collection, and emergency responses.
          </p>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer text-white text-center py-3" style={{ backgroundColor: "#1b558b" }}>
        <p>&copy; 2024 Smart Healthcare System. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
