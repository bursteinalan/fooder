import { StorageAdapter } from '../storage/storage-factory';
import {
  SavedGroceryList,
  SavedGroceryListItem,
  CreateSavedGroceryListDto,
  UpdateSavedGroceryListDto,
  AddItemDto,
} from '../models/saved-grocery-list.model';
import { randomBytes } from 'crypto';

export class SavedGroceryListService {
  constructor(private storageService: StorageAdapter) {}

  /**
   * Helper method to detect if storage adapter supports async operations
   */
  private isAsync(): boolean {
    return 'getSavedGroceryListAsync' in this.storageService;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Create a new saved grocery list
   */
  async create(userId: string, dto: CreateSavedGroceryListDto): Promise<SavedGroceryList> {
    const listId = this.generateId();
    const now = new Date().toISOString();

    // Transform items with IDs, order numbers, and initialize as unchecked
    const items: SavedGroceryListItem[] = dto.items.map((item, index) => ({
      id: this.generateId(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: false,
      order: index,
    }));

    const savedList: SavedGroceryList = {
      id: listId,
      userId,
      name: dto.name,
      items,
      recipeIds: dto.recipeIds,
      createdAt: now,
      updatedAt: now,
    };

    // Persist to storage
    if (this.isAsync()) {
      await this.storageService.setSavedGroceryListAsync!(userId, savedList);
    } else {
      this.storageService.setSavedGroceryList(userId, savedList);
    }

    return savedList;
  }

  /**
   * List all saved grocery lists for a user, sorted by creation date (newest first)
   */
  async list(userId: string): Promise<SavedGroceryList[]> {
    let lists: SavedGroceryList[];

    if (this.isAsync()) {
      lists = await this.storageService.listSavedGroceryListsAsync!(userId);
    } else {
      lists = this.storageService.listSavedGroceryLists(userId);
    }

    // Sort by createdAt descending (newest first)
    return lists.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Get a specific saved grocery list by ID
   */
  async getById(userId: string, listId: string): Promise<SavedGroceryList | null> {
    let list: SavedGroceryList | null;

    if (this.isAsync()) {
      list = await this.storageService.getSavedGroceryListAsync!(userId, listId);
    } else {
      list = this.storageService.getSavedGroceryList(userId, listId);
    }

    // Verify list belongs to user
    if (list && list.userId !== userId) {
      return null;
    }

    return list;
  }

  /**
   * Update a saved grocery list (rename)
   */
  async update(
    userId: string,
    listId: string,
    dto: UpdateSavedGroceryListDto
  ): Promise<SavedGroceryList | null> {
    // Retrieve existing list
    const list = await this.getById(userId, listId);
    if (!list) {
      return null;
    }

    // Update name field if provided
    if (dto.name !== undefined) {
      list.name = dto.name;
    }

    // Update updatedAt timestamp
    list.updatedAt = new Date().toISOString();

    // Persist changes
    if (this.isAsync()) {
      await this.storageService.setSavedGroceryListAsync!(userId, list);
    } else {
      this.storageService.setSavedGroceryList(userId, list);
    }

    return list;
  }

  /**
   * Delete a saved grocery list
   */
  async delete(userId: string, listId: string): Promise<boolean> {
    // Verify list exists and belongs to user
    const list = await this.getById(userId, listId);
    if (!list) {
      return false;
    }

    // Remove from storage
    if (this.isAsync()) {
      await this.storageService.deleteSavedGroceryListAsync!(userId, listId);
    } else {
      this.storageService.deleteSavedGroceryList(userId, listId);
    }

    return true;
  }

  /**
   * Toggle the checked state of an item
   */
  async toggleItemChecked(
    userId: string,
    listId: string,
    itemId: string
  ): Promise<SavedGroceryList | null> {
    // Retrieve list
    const list = await this.getById(userId, listId);
    if (!list) {
      return null;
    }

    // Find item by ID
    const item = list.items.find((i) => i.id === itemId);
    if (!item) {
      return null;
    }

    // Toggle checked state
    item.checked = !item.checked;

    // Update updatedAt timestamp
    list.updatedAt = new Date().toISOString();

    // Persist changes
    if (this.isAsync()) {
      await this.storageService.setSavedGroceryListAsync!(userId, list);
    } else {
      this.storageService.setSavedGroceryList(userId, list);
    }

    return list;
  }

  /**
   * Add a new item to a saved grocery list
   */
  async addItem(
    userId: string,
    listId: string,
    dto: AddItemDto
  ): Promise<SavedGroceryList | null> {
    // Retrieve list
    const list = await this.getById(userId, listId);
    if (!list) {
      return null;
    }

    // Calculate order number (max + 1)
    const maxOrder = list.items.reduce((max, item) => Math.max(max, item.order), -1);

    // Create new item
    const newItem: SavedGroceryListItem = {
      id: this.generateId(),
      name: dto.name,
      quantity: dto.quantity,
      unit: dto.unit,
      category: dto.category,
      checked: false,
      order: maxOrder + 1,
    };

    // Add to items array
    list.items.push(newItem);

    // Update updatedAt timestamp
    list.updatedAt = new Date().toISOString();

    // Persist changes
    if (this.isAsync()) {
      await this.storageService.setSavedGroceryListAsync!(userId, list);
    } else {
      this.storageService.setSavedGroceryList(userId, list);
    }

    return list;
  }

  /**
   * Remove an item from a saved grocery list
   */
  async removeItem(
    userId: string,
    listId: string,
    itemId: string
  ): Promise<SavedGroceryList | null> {
    // Retrieve list
    const list = await this.getById(userId, listId);
    if (!list) {
      return null;
    }

    // Filter out item by ID
    const originalLength = list.items.length;
    list.items = list.items.filter((item) => item.id !== itemId);

    // If no item was removed, return null
    if (list.items.length === originalLength) {
      return null;
    }

    // Update updatedAt timestamp
    list.updatedAt = new Date().toISOString();

    // Persist changes
    if (this.isAsync()) {
      await this.storageService.setSavedGroceryListAsync!(userId, list);
    } else {
      this.storageService.setSavedGroceryList(userId, list);
    }

    return list;
  }
}
