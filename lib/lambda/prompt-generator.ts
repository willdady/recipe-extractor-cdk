import * as ejs from 'ejs';

const PROMPT_TEMPLATE = `Read the HTML fragment contained inside the following <document></document> XML tags and extract the recipe.

<document>
<%- document %>
</document>

If you are able to successfully find a recipe in the document output your result as a JSON object with the following fields:

title: A string containing the receipe title
description: A string containing a summary of what the recipe makes
ingredients: An array of strings where each is a single ingredient
steps: An array of strings where each describes a step required to complete the recipe

<example>
{
  "title": "Pasta Aglio E Oilio",
  "description": "Pasta Aglio e Olio is a classic Italian dish known for its simplicity and flavor. Translating to 'pasta with garlic and oil' it's a traditional recipe originating from the region of Naples. The dish features spaghetti cooked al dente and then tossed with minced garlic, olive oil, red pepper flakes, and sometimes parsley. Despite its minimal ingredients, Pasta Aglio e Olio packs a punch of flavor, with the garlic-infused oil coating each strand of pasta for a deliciously satisfying meal. It's a go-to dish for a quick, easy, and tasty dinner option.",
  "ingredients": [
    "Half a Lemon",
    "Fresh Grated Parmesan",
    "2 - 3 Tbsp Butter",
    "1 Cup Chopped Italian Parsley",
    "1 Pinch Chili Flakes or Hot Pepper FlakesFresh",
    "Ground Pepper",
    "2 Tbsp Salt (for pasta water)",
    "3 Cloves Thin Sliced Fresh Garlic",
    "1 Cup Pasta Water",
    "1/4 Cup Olive Oil",
    "450g Spaghetti"
  ],
  "steps": [
    "Slice garlic cloves thin (do not chop) and remove stems from parsley. Chop parsley fine and set all this aside. Have all your ingredients handy and ready since you will need to get to them quickly.",
    "Bring water with 2 TBSP salt to a boil and add pasta. Cook for 10-12 minutes till al dente. Save 2 cups of the hot pasta water (for possibly creating more liquid) before draining.",
    "About 5 minutes before your pasta is ready, heat the olive oil in large pan on medium and add the sliced garlic. Toss gently and after about 30 seconds add the hot pepper flakes and salt and pepper. Cook and toss for about 30 seconds.",
    "Add parsley, cooked pasta, pasta water to your liking, butter and squeeze in the half lemon (watch for seeds). Stir gently and bring to gentle boil. Add more fresh pepper and salt to taste. Toss the mixture well to fully coat and turn off heat.",
    "Let mixture set about 30 seconds so liquid thickens. Serve hot and top with fresh grated parmesan."
  ]
}
</example>

If you are not able to find a recipe in the document respond with a JSON object with the following fields:

error: A string stating "No recipe found in document"
cause: A string describing the error

<example>
{
  "error": "No recipe found in document",
  "cause": "The document appears to be about Harley Davidson motocycles"
}
</example>

<example>
{
  "error": "No recipe found in document",
  "cause": "The document appears to be about cats"
}
</example>`;

interface Payload {
  input: string;
}

export const handler = async ({ input }: Payload) => {
  const output = ejs.render(PROMPT_TEMPLATE, { document: input });
  return { output };
};
