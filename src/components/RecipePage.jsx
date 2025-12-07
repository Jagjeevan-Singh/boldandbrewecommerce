import { useParams } from 'react-router-dom';
import { FaRegStar } from 'react-icons/fa';
import './RecipePage.css';

function RecipePage() {
  const { type } = useParams();

  const recipeDetails = {
    espresso: {
      title: 'How to Make the Perfect Instant Espresso',
      custom: (
        <div className="espresso-recipe-beautiful">
          <h2 style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:'0.5em',lineHeight:1.1}}>
            <FaRegStar style={{color:'#c39b2b',fontSize:'1.3em',position:'relative',top:'2px',flexShrink:0}} />
            <span>Instant Coffee <span style={{color:'#c39b2b'}}>&quot;Espresso&quot;</span> Base</span>
          </h2>
          <p className="espresso-desc">This is the foundation for all three drinks. <b>Whisking the coffee and hot water together vigorously is the secret to creating a beautiful, foamy layer that mimics the "crema" of a real espresso.</b></p>
          <div className="espresso-section">
            <h3>What you'll need:</h3>
            <ul className="espresso-list">
              <li><b>2 teaspoons</b> of your instant coffee</li>
              <li><b>2 tablespoons</b> of hot water <span className="espresso-note">(not boiling)</span></li>
              <li>A small bowl or mug</li>
              <li>A whisk or a spoon</li>
            </ul>
          </div>
          <div className="espresso-section">
            <h3>Instructions:</h3>
            <ol className="espresso-steps">
              <li>Add the instant coffee granules and hot water to a small mug.</li>
              <li>Using a small whisk or a spoon, <b>stir vigorously for about 30 seconds to 1 minute</b>.</li>
              <li>Watch as the mixture transforms into a thick, foamy, and pale brown paste. <span className="espresso-highlight">This is your "espresso" base.</span></li>
            </ol>
            <div className="espresso-tip"><b>Pro Tip:</b> The more you whisk, the thicker and creamier the foam on top will be.</div>
          </div>
          <div className="espresso-section">
            <h2 style={{marginTop:'2em'}}>The <span style={{color:'#c39b2b'}}>Instant Espresso</span></h2>
            <div className="espresso-desc">For the purists who appreciate a strong, bold cup.</div>
            <h3>What you'll need:</h3>
            <ul className="espresso-list">
              <li>Your Instant Coffee "Espresso" Base</li>
              <li>A small espresso cup</li>
            </ul>
            <h3>Instructions:</h3>
            <ol className="espresso-steps">
              <li>Prepare the Instant Coffee "Espresso" Base as described above.</li>
              <li>Pour the mixture directly into a small espresso cup.</li>
              <li>Enjoy the rich, full-bodied flavor and the velvety foam on top.</li>
            </ol>
          </div>
        </div>
      ),
      prepTime: '5 minutes',
      serves: '1 cup'
    },
    cappuccino: {
      title: 'How to Make a Café-Style Instant Cappuccino',
      custom: (
        <div className="espresso-recipe-beautiful">
          <h2 style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:'0.5em',lineHeight:1.1}}>
            <FaRegStar style={{color:'#c39b2b',fontSize:'1.3em',position:'relative',top:'2px',flexShrink:0}} />
            Instant Coffee <span style={{color:'#c39b2b'}}>&quot;Espresso&quot;</span> Base
          </h2>
          <p className="espresso-desc">This is the foundation for all three drinks. <b>Whisking the coffee and hot water together vigorously is the secret to creating a beautiful, foamy layer that mimics the "crema" of a real espresso.</b></p>
          <div className="espresso-section">
            <h3>What you'll need:</h3>
            <ul className="espresso-list">
              <li><b>2 teaspoons</b> of your instant coffee</li>
              <li><b>2 tablespoons</b> of hot water <span className="espresso-note">(not boiling)</span></li>
              <li>A small bowl or mug</li>
              <li>A whisk or a spoon</li>
            </ul>
          </div>
          <div className="espresso-section">
            <h3>Instructions:</h3>
            <ol className="espresso-steps">
              <li>Add the instant coffee granules and hot water to a small mug.</li>
              <li>Using a small whisk or a spoon, <b>stir vigorously for about 30 seconds to 1 minute</b>.</li>
              <li>Watch as the mixture transforms into a thick, foamy, and pale brown paste. <span className="espresso-highlight">This is your "espresso" base.</span></li>
            </ol>
            <div className="espresso-tip"><b>Pro Tip:</b> The more you whisk, the thicker and creamier the foam on top will be.</div>
          </div>
          <div className="espresso-section">
            <h2 style={{marginTop:'2em'}}>The <span style={{color:'#c39b2b'}}>Instant Cappuccino</span></h2>
            <div className="espresso-desc">A classic balance of bold coffee, velvety steamed milk, and a delightful cloud of foam.</div>
            <h3>What you'll need:</h3>
            <ul className="espresso-list">
              <li>Your Instant Coffee "Espresso" Base</li>
              <li><b>1/2 cup (120ml)</b> of milk (dairy or plant-based)</li>
              <li>A milk frother, French press, or a sealed jar</li>
            </ul>
            <h3>Instructions:</h3>
            <ol className="espresso-steps">
              <li>Prepare the Instant Coffee "Espresso" Base and pour it into your mug.</li>
              <li><b>To Froth the Milk:</b>
                <ul className="espresso-list" style={{marginTop:'0.5em'}}>
                  <li><b>Using a Milk Frother:</b> Heat the milk to your desired temperature (do not boil). Use the frother to create a thick, airy foam.</li>
                  <li><b>Using a French Press:</b> Heat the milk and pour it into a clean French press. Plunge the filter up and down rapidly until the milk is frothy.</li>
                  <li><b>Using a Sealed Jar:</b> Heat the milk and pour it into a tightly sealed jar, filling it no more than halfway. Shake it vigorously for 30-60 seconds until the milk doubles in volume and becomes foamy.</li>
                </ul>
              </li>
              <li>Pour the frothed milk over your coffee base. Use a spoon to hold back the foam and pour in the liquid milk first, then spoon the thick foam on top.</li>
              <li>Optionally, dust with a sprinkle of cocoa powder or cinnamon for a final flourish.</li>
            </ol>
          </div>
        </div>
      ),
      prepTime: '10 minutes',
      serves: '1 cup'
    },
    latte: {
      title: 'How to Make a Creamy Instant Latte',
      custom: (
        <div className="espresso-recipe-beautiful">
          <h2 style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:'0.5em',lineHeight:1.1}}>
            <FaRegStar style={{color:'#c39b2b',fontSize:'1.3em',position:'relative',top:'2px',flexShrink:0}} />
            <span>Instant Coffee <span style={{color:'#c39b2b'}}>&quot;Espresso&quot;</span> Base</span>
          </h2>
          <p className="espresso-desc">This is the foundation for all three drinks. <b>Whisking the coffee and hot water together vigorously is the secret to creating a beautiful, foamy layer that mimics the "crema" of a real espresso.</b></p>
          <div className="espresso-section">
            <h3>What you'll need:</h3>
            <ul className="espresso-list">
              <li><b>2 teaspoons</b> of your instant coffee</li>
              <li><b>2 tablespoons</b> of hot water <span className="espresso-note">(not boiling)</span></li>
              <li>A small bowl or mug</li>
              <li>A whisk or a spoon</li>
            </ul>
          </div>
          <div className="espresso-section">
            <h3>Instructions:</h3>
            <ol className="espresso-steps">
              <li>Add the instant coffee granules and hot water to a small mug.</li>
              <li>Using a small whisk or a spoon, <b>stir vigorously for about 30 seconds to 1 minute</b>.</li>
              <li>Watch as the mixture transforms into a thick, foamy, and pale brown paste. <span className="espresso-highlight">This is your "espresso" base.</span></li>
            </ol>
            <div className="espresso-tip"><b>Pro Tip:</b> The more you whisk, the thicker and creamier the foam on top will be.</div>
          </div>
          <div className="espresso-section">
            <h2 style={{marginTop:'2em'}}>The <span style={{color:'#c39b2b'}}>Instant Latte</span></h2>
            <div className="espresso-desc">Smooth, creamy, and comforting. The latte is all about the steamed milk with just a touch of foam.</div>
            <h3>What you'll need:</h3>
            <ul className="espresso-list">
              <li>Your Instant Coffee "Espresso" Base</li>
              <li><b>3/4 cup (180ml)</b> of milk (dairy or plant-based)</li>
              <li>A small milk frother or a mug and spoon</li>
            </ul>
            <h3>Instructions:</h3>
            <ol className="espresso-steps">
              <li>Prepare the Instant Coffee "Espresso" Base and set it aside in your mug.</li>
              <li>Heat the milk in a pot or microwave until it is steaming, but not boiling.</li>
              <li><b>To Froth the Milk:</b>
                <ul className="espresso-list" style={{marginTop:'0.5em'}}>
                  <li><b>Using a Frother:</b> Gently pulse a milk frother in the warm milk for just a few seconds to create a light layer of foam.</li>
                  <li><b>Using a Spoon:</b> Simply use a spoon to stir the milk rapidly as it heats to incorporate air, creating a small amount of foam.</li>
                </ul>
              </li>
              <li>Slowly pour the warm, steamed milk over your coffee base, letting the small amount of foam naturally top the drink.</li>
              <li>Stir gently and enjoy the smooth, milky perfection.</li>
            </ol>
          </div>
        </div>
      ),
      prepTime: '8 minutes',
      serves: '1 cup'
    }
  };

  const recipe = recipeDetails[type];

  if (!recipe) return <p>Recipe not found.</p>;

  return (
    <div className="recipe-page">
      {recipe.custom ? (
        <>
          {recipe.custom}
          <div className="espresso-meta">
            <span><b>Preparation Time:</b> {recipe.prepTime}</span>
            <span style={{marginLeft:'1.5em'}}><b>Serves:</b> {recipe.serves}</span>
          </div>
        </>
      ) : (
        <>
          <h2>{recipe.title}</h2>
          <p><strong>Preparation Time:</strong> {recipe.prepTime}</p>
          <p><strong>Serves:</strong> {recipe.serves}</p>
          <h3>Ingredients</h3>
          <ul>
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
          <h3>Steps</h3>
          <ol>
            {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </>
      )}
    </div>
  );
}

export default RecipePage;
