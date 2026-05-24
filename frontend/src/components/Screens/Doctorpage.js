import React from 'react';

function Doctorpage() {
  return (
    <div className="page-container" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="container text-center py-5">
        {/* Doctor's Welcome Image with Rotating Gradient Circle */}
        <div className="image-wrapper mb-4" style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src="https://img.freepik.com/premium-photo/photo-doctor-with-stethoscope-plain-medical-background_763111-13168.jpg"
            alt="Doctor"
            loading="lazy"
            decoding="async"
            className="doctor-image rounded-circle"
            style={{ width: '250px', height: '250px', objectFit: 'cover' }}
          />
          <div
            className="circle-animation"
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '4px solid rgba(0, 0, 255, 0.5)',
              animation: 'rotate 5s infinite linear',
            }}
          ></div>
        </div>

        {/* Motivational and Welcome Text */}
        <h1 style={{ color: '#1b558b', fontSize: '36px', fontWeight: 'bold' }}>
          Welcome, Doctor!
        </h1>

        <p style={{ color: '#555', fontSize: '18px', marginBottom: '30px' }}>
          You are making a difference in the world. Thank you for your hard work and dedication.
        </p>

        <p style={{ color: '#555', fontSize: '16px' }}>
          Every day, you save lives, offer comfort, and inspire those around you. Keep going strong! 💪
        </p>

        {/* Action Buttons */}
        <div className="mt-4 mb-4">
          <a href="/ehr-management" className="btn btn-primary btn-lg" style={{ borderRadius: '30px', padding: '10px 30px', fontWeight: 'bold', backgroundColor: '#1b558b', border: 'none' }}>
            🏥 Manage Patient EHR Records
          </a>
        </div>

        {/* Motivational Talks Section */}
        <section className="my-5">
          <h3 style={{ color: '#1b558b', fontSize: '28px', fontWeight: 'bold' }}>
            Motivational Talks
          </h3>

          <div className="carousel slide" data-bs-ride="carousel" id="motivationalCarousel">
            <div className="carousel-inner">
              {/* Motivational Talk 1 */}
              <div className="carousel-item active">
                <blockquote style={{ fontSize: '18px', fontStyle: 'italic', color: '#555' }}>
                  "The work you do is not just a job. It's a calling, a purpose. Keep striving to heal and inspire."
                </blockquote>
              </div>
              {/* Motivational Talk 2 */}
              <div className="carousel-item">
                <blockquote style={{ fontSize: '18px', fontStyle: 'italic', color: '#555' }}>
                  "In the face of adversity, your resilience stands tall. Your care and commitment to your patients is unmatched."
                </blockquote>
              </div>
              {/* Motivational Talk 3 */}
              <div className="carousel-item">
                <blockquote style={{ fontSize: '18px', fontStyle: 'italic', color: '#555' }}>
                  "Every life you touch is a step toward making the world a better, healthier place. Keep inspiring!"
                </blockquote>
              </div>
            </div>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#motivationalCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#motivationalCarousel"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        </section>

        {/* Closing Encouragement */}
        <p style={{ color: '#555', fontSize: '16px', marginTop: '40px' }}>
          Keep going, Doctor. Your efforts don't go unnoticed. You are a beacon of hope in the world.
        </p>
      </div>
    </div>
  );
}

export default Doctorpage;
