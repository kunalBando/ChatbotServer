import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

//const port = 5000;
const port = process.env.PORT || 5000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://nice-sky-08aa0150f.4.azurestaticapps.net', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const fetchEntityNames = async () => {
  try {
    const response = await axios.get(
      "https://featuremarketplacewebapi.azurewebsites.net/api/Entity/GetAllEntities"
    );

    const entityNames = response.data.map((entity) => entity.entityName);

    return entityNames;

   
  } catch (error) {
    throw error;
  }
};

const fetchFeatureNamesByEntityName = async (entityName) => {
  try {
    const apiUrl = `https://featuremarketplacewebapi.azurewebsites.net/api/Feature/GetFeaturesByEntityName/${entityName}`;
    
    const response = await axios.get(apiUrl);

    // Extract feature names from the array of feature objects
    const featureNames = response.data.map((feature) => feature.featureName);
    return featureNames;
  } catch (error) {
    throw error;
  }
};

// Function to extract entity name from the user's prompt
const extractEntityNameFromPrompt = (prompt) => {
  // Define patterns to match entity-related phrases
  const entityPatterns = [
    /(?:get|fetch|show)\s*(?:me)?\s*(?:the)?\s*features\s*(?:of|for|in)?\s*(?:the)?\s*("?.*?"?)\s*entity/i,
    /(?:features\s*(?:of|for|in)?\s*(?:the)?\s*("?.*?"?)\s*entity)/i,
    /(?:get|fetch|show)\s*(?:me)?\s*(?:the)?\s*("?.*?"?)\s*entity\s*features/i,
    /(?:features\s*(?:of|for|in)?\s*(?:the)?\s*("?.*?"?))/i,
    /(?:list|show)\s*(?:me)?\s*(?:all)?\s*features\s*(?:of|for|in)?\s*(?:the)?\s*("?.*?"?)\s*entity/i,
    /(?:get|fetch)\s*(?:all)?\s*("?.*?"?)\s*entity\s*features/i,
    /(?:what\s*are|tell\s*me\s*about)\s*(?:the)?\s*features\s*(?:of|for|in)?\s*(?:the)?\s*("?.*?"?)\s*entity/i,
  ];
  

  // Try to match entity patterns in the prompt
  for (const pattern of entityPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      // Extracted entity name
      return match[1].toLowerCase();
    }
  }

  // If no match is found
  return null;
};



app.get("/", async (req, res) => {
  res.status(200).send({
    bot : "Hello! The API server is up and running.",
  });
});

app.post("/", async (req, res) => {
  try {
    const prompt = req.body.prompt.toLowerCase();

    if (prompt.includes("search") && prompt.includes("features") && prompt.includes("given") && prompt.includes("entity"))  
    {
      res.status(200).send({
        bot: "Type a prompt like 'Get me features for [entity name] entity' ",
      });
    } 
    else if (prompt.includes("features") && prompt.includes("entity")) {
      // Extract entity name from the user's prompt
      const entityName = extractEntityNameFromPrompt(prompt);

      // Check if entityName is valid
      if (entityName) {
        // Fetch feature names for the specified entity
        const featureNames = await fetchFeatureNamesByEntityName(entityName);
        res.status(200).send({
          bot: ` Here are the feature names for the entity "${entityName}": ${featureNames.join(", ")}`,
        });
      } else {
        res.status(200).send({
          bot: "Please provide a valid entity name to fetch its features.",
        });
      }
    }
    else if (
      (prompt.includes("add") && prompt.includes("entity")) ||
      (prompt.includes("add") && prompt.includes("feature")) ||
      (prompt.includes("add")  && prompt.includes("entities"))||
      (prompt.includes("add")  && prompt.includes("features"))
    ) 
    {
      res.status(200).send({
        bot: "From the Home page click the add button(to add individual entities) or upload button(as CSV file) to upload your features. Enter the entity name you want to add features to if it exists the features will be added to the existing entity with the same name or enter a unique name to create a new entity to add you features in it.",
      });
    } else if (
      prompt.includes("entity") ||
      prompt.includes("available entities") ||
      prompt.includes("entities")
    ) 
    {
      const entityNames = await fetchEntityNames();      
      res.status(200).send({
        bot: "Here are the available entity names: " + entityNames.join(", "),
      });
    }  
    else if (prompt.includes("tell") && prompt.includes("me") && prompt.includes("about") && prompt.includes("website")) 
    {
      res.status(200).send({
        bot: "This is a feature sharing marketpalace that makes it easy for Data Scientists to View, Add, Edit and Delete features for training their machine learning models using our 2FA secured application.",
      });
    } 
    else if (prompt.includes("tell") && prompt.includes("can") && prompt.includes("do")) 
    {
      res.status(200).send({
        bot: "You can ask me about how to add entities or features, all the available entities, features in a given entity and much more about our website.",
      });
    } 
    else if (prompt.includes("hello") || prompt.includes("hi")) {
      res.status(200).send({
        bot: "Hello! How can I help you?",
      });
    }      
    else {
      res.status(200).send({
        bot: "Please provide a valid prompt. You can ask me about how to add entities or features, all the available entities, features in a given entity and much more about our website.",
      });
      
      // const response = await openai.createCompletion({
      //   model: "gpt-3.5-turbo", //"text-davinci-003",
      //   prompt: `${prompt}`,
      //   temperature: 1,
      //   max_tokens: 1024,
      //   top_p: 1,
      //   frequency_penalty: 0.5,
      //   presence_penalty: 0,
      // });

      // res.status(200).send({
      //   bot: response.data.choices[0].text,
      // });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.listen(port, '0.0.0.0' , () =>
  console.log(`Server is running on http://localhost:${port}`)
);
