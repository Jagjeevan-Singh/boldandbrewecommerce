import { useNavigate } from 'react-router-dom';
import espressoImg from '../assets/espresso.jpg';
import espressoHoverImg from '../assets/espresso2.png';
import cappuccinoImg from '../assets/cappuccino.jpg';
import cappuccinoHoverImg from '../assets/cappuccino2.png';
import latteImg from '../assets/latte.jpg';
import latteHoverImg from '../assets/latte2.png';
import './RecipeSection.css';

const recipes = [
  {
    id: 1,
    title: 'Espresso Recipe',
    image: espressoImg,
    hoverImage: espressoHoverImg,
    link: '/recipe/espresso'
  },
  {
    id: 2,
    title: 'Cappuccino Recipe',
    image: cappuccinoImg,
    hoverImage: cappuccinoHoverImg,
    link: '/recipe/cappuccino'
  },
  {
    id: 3,
    title: 'Latte Recipe',
    image: latteImg,
    hoverImage: latteHoverImg,
    link: '/recipe/latte'
  }
];

function RecipeSection() {
  const navigate = useNavigate();

  return (
    <section className="recipe-section">
      <h2>Discover Our Recipes</h2>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="recipe-card"
            onClick={() => navigate(recipe.link)}
          >
            <div className="recipe-image-container">
              <img src={recipe.image} alt={recipe.title} className="recipe-image" />
              <img src={recipe.hoverImage} alt={recipe.title} className="recipe-hover-image" />
            </div>
            <h3>{recipe.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecipeSection;
