
import Slider from "react-slick";
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
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000, // 10 seconds
    arrows: true,         // enable arrows
  };

  const handleBannerClick = () => {
    navigate('/products');
  };

  return (
    <div className="banner-slider">
      <Slider {...settings}>
        <div>
          <img src={banner1} alt="Banner 1" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
        <div>
          <img src={banner2} alt="Banner 2" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
        <div>
          <img src={banner3} alt="Banner 3" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
        <div>
          <img src={banner4} alt="Banner 4" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
      </Slider>
    </div>
  );
}

export default Banner;