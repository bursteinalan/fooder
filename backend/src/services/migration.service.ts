import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { StorageService, StorageData } from '../storage/storage.service';
import { User } from '../models/user.model';

// Ingredient categories extracted from grocery-list.service.ts
const INGREDIENT_CATEGORIES: { [key: string]: string } = {
  // Produce
  'onion': 'Produce',
  'garlic': 'Produce',
  'ginger': 'Produce',
  'carrot': 'Produce',
  'carrots': 'Produce',
  'celery': 'Produce',
  'potato': 'Produce',
  'potatoes': 'Produce',
  'tomato': 'Produce',
  'tomatoes': 'Produce',
  'lettuce': 'Produce',
  'spinach': 'Produce',
  'kale': 'Produce',
  'broccoli': 'Produce',
  'cauliflower': 'Produce',
  'bell pepper': 'Produce',
  'pepper': 'Produce',
  'cucumber': 'Produce',
  'zucchini': 'Produce',
  'mushroom': 'Produce',
  'mushrooms': 'Produce',
  'apple': 'Produce',
  'banana': 'Produce',
  'lemon': 'Produce',
  'lime': 'Produce',
  'orange': 'Produce',
  'avocado': 'Produce',
  'cilantro': 'Produce',
  'parsley': 'Produce',
  'basil': 'Produce',
  'thyme': 'Produce',
  'rosemary': 'Produce',
  
  // Meat & Seafood
  'chicken': 'Meat & Seafood',
  'beef': 'Meat & Seafood',
  'pork': 'Meat & Seafood',
  'turkey': 'Meat & Seafood',
  'lamb': 'Meat & Seafood',
  'fish': 'Meat & Seafood',
  'salmon': 'Meat & Seafood',
  'tuna': 'Meat & Seafood',
  'shrimp': 'Meat & Seafood',
  'ground beef': 'Meat & Seafood',
  'ground turkey': 'Meat & Seafood',
  'bacon': 'Meat & Seafood',
  'sausage': 'Meat & Seafood',
  
  // Dairy & Eggs
  'milk': 'Dairy & Eggs',
  'butter': 'Dairy & Eggs',
  'cheese': 'Dairy & Eggs',
  'cream': 'Dairy & Eggs',
  'yogurt': 'Dairy & Eggs',
  'sour cream': 'Dairy & Eggs',
  'egg': 'Dairy & Eggs',
  'eggs': 'Dairy & Eggs',
  'cream cheese': 'Dairy & Eggs',
  'parmesan': 'Dairy & Eggs',
  'mozzarella': 'Dairy & Eggs',
  'cheddar': 'Dairy & Eggs',
  
  // Pantry & Dry Goods
  'flour': 'Pantry & Dry Goods',
  'sugar': 'Pantry & Dry Goods',
  'salt': 'Pantry & Dry Goods',
  'black pepper': 'Spices & Seasonings',
  'rice': 'Pantry & Dry Goods',
  'pasta': 'Pantry & Dry Goods',
  'bread': 'Pantry & Dry Goods',
  'oil': 'Pantry & Dry Goods',
  'olive oil': 'Pantry & Dry Goods',
  'vegetable oil': 'Pantry & Dry Goods',
  'coconut oil': 'Pantry & Dry Goods',
  'vinegar': 'Pantry & Dry Goods',
  'soy sauce': 'Pantry & Dry Goods',
  'honey': 'Pantry & Dry Goods',
  'maple syrup': 'Pantry & Dry Goods',
  'beans': 'Pantry & Dry Goods',
  'lentils': 'Pantry & Dry Goods',
  'chickpeas': 'Pantry & Dry Goods',
  'oats': 'Pantry & Dry Goods',
  'quinoa': 'Pantry & Dry Goods',
  'cornstarch': 'Pantry & Dry Goods',
  'baking powder': 'Pantry & Dry Goods',
  'baking soda': 'Pantry & Dry Goods',
  'vanilla': 'Pantry & Dry Goods',
  'vanilla extract': 'Pantry & Dry Goods',
  'chocolate chips': 'Pantry & Dry Goods',
  'nuts': 'Pantry & Dry Goods',
  'almonds': 'Pantry & Dry Goods',
  'walnuts': 'Pantry & Dry Goods',
  
  // Spices & Seasonings
  'cumin': 'Spices & Seasonings',
  'paprika': 'Spices & Seasonings',
  'chili powder': 'Spices & Seasonings',
  'cayenne': 'Spices & Seasonings',
  'turmeric': 'Spices & Seasonings',
  'cinnamon': 'Spices & Seasonings',
  'nutmeg': 'Spices & Seasonings',
  'oregano': 'Spices & Seasonings',
  'bay leaf': 'Spices & Seasonings',
  'bay leaves': 'Spices & Seasonings',
  'red pepper': 'Spices & Seasonings',
  'crushed red pepper': 'Spices & Seasonings',
  'garlic powder': 'Spices & Seasonings',
  'onion powder': 'Spices & Seasonings',
  
  // Canned & Jarred
  'tomato sauce': 'Canned & Jarred',
  'crushed tomatoes': 'Canned & Jarred',
  'diced tomatoes': 'Canned & Jarred',
  'tomato paste': 'Canned & Jarred',
  'coconut milk': 'Canned & Jarred',
  'chicken broth': 'Canned & Jarred',
  'beef broth': 'Canned & Jarred',
  'vegetable broth': 'Canned & Jarred',
  'stock': 'Canned & Jarred',
  'broth': 'Canned & Jarred',
};

export class MigrationService {
  private storageService: StorageService;
  private storagePath: string;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.storagePath = path.resolve('./data/storage.json');
  }

  /**
   * Hash a password using PBKDF2 with a random salt
   * Format: salt:hash
   */
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Detect if migration is needed by checking if the storage has the old structure
   */
  needsMigration(): boolean {
    try {
      const rawData = fs.readFileSync(this.storagePath, 'utf-8');
      const data = JSON.parse(rawData);

      // Check if the data has the old structure (only recipes, no users/sessions/commonCategories)
      const hasOldStructure = 
        data.recipes && 
        typeof data.recipes === 'object' &&
        !data.users &&
        !data.sessions &&
        !data.commonCategories;

      // Also check if recipes don't have userId field
      if (hasOldStructure) {
        return true;
      }

      // Check if any recipe is missing userId
      if (data.recipes && typeof data.recipes === 'object') {
        const recipes = Object.values(data.recipes) as any[];
        const hasRecipeWithoutUserId = recipes.some(recipe => !recipe.userId);
        if (hasRecipeWithoutUserId) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // If file doesn't exist or can't be read, no migration needed
      return false;
    }
  }

  /**
   * Perform the migration from old structure to new structure
   */
  async migrate(): Promise<void> {
    console.log('Starting data migration...');

    // Create backup of original storage.json
    this.createBackup();

    // Read the old data
    const rawData = fs.readFileSync(this.storagePath, 'utf-8');
    const oldData = JSON.parse(rawData);

    // Create default user with username "default" and password "password"
    const defaultUserId = uuidv4();
    const passwordHash = this.hashPassword('password');
    
    const defaultUser: User = {
      id: defaultUserId,
      username: 'default',
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
      customCategories: {}, // Initialize as empty, user can customize later
    };

    // Add userId to all existing recipes
    const migratedRecipes: Record<string, any> = {};
    if (oldData.recipes && typeof oldData.recipes === 'object') {
      for (const [recipeId, recipe] of Object.entries(oldData.recipes)) {
        migratedRecipes[recipeId] = {
          ...(recipe as object),
          userId: defaultUserId,
        };
      }
    }

    // Create new storage structure
    const newData: StorageData = {
      users: {
        [defaultUserId]: defaultUser,
      },
      sessions: {},
      recipes: migratedRecipes,
      commonCategories: INGREDIENT_CATEGORIES,
      savedGroceryLists: {},
    };

    // Write the new structure
    this.storageService.write(newData);

    console.log('Migration completed successfully!');
    console.log(`- Created default user with username "default"`);
    console.log(`- Migrated ${Object.keys(migratedRecipes).length} recipes`);
    console.log(`- Added ${Object.keys(INGREDIENT_CATEGORIES).length} common ingredient categories`);
  }

  /**
   * Create a backup of the original storage.json file
   */
  private createBackup(): void {
    try {
      const backupPath = `${this.storagePath}.pre-migration-backup`;
      fs.copyFileSync(this.storagePath, backupPath);
      console.log(`Backup created at: ${backupPath}`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
