import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.jpg";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Banner.css";
import { useNavigate } from "react-router-dom";

function Banner() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const bannerRef = doc(db, 'settings', 'hero_banners');
    const unsubscribe = onSnapshot(bannerRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().banners && docSnap.data().banners.length > 0) {
        setBanners(docSnap.data().banners);
      } else {
        setBanners([]); // Fallback to defaults
      }
    }, (error) => {
      console.error("Error fetching hero banners:", error);
    });

    return () => unsubscribe();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
  };

  const handleBannerClick = () => {
    navigate('/products');
  };

  // Default banners if none configured
  const defaultBanners = [
    { webImage: banner1, mobileImage: banner1 },
    { webImage: banner2, mobileImage: banner2 },
    { webImage: banner3, mobileImage: banner3 },
    { webImage: banner4, mobileImage: banner4 },
  ];

  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  return (
    <div className="banner-slider">
      <Slider {...settings}>
        {displayBanners.map((banner, index) => (
          <div key={index} onClick={handleBannerClick} style={{ cursor: 'pointer' }}>
            <picture>
              <source media="(max-width: 768px)" srcSet={banner.mobileImage} />
              <source media="(min-width: 769px)" srcSet={banner.webImage} />
              <img src={banner.webImage} alt={`Banner ${index + 1}`} className="banner-image" />
            </picture>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default Banner;