import Category from "../models/CategoryModel.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.json(categories);
    } catch (err) {
        console.error("getAllCategories error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { category_id } = req.params;
        const category = await Category.getById(category_id);
        if (!category) return res.status(404).json({ error: "Category not found" });
        res.json(category);
    } catch (err) {
        console.error("getCategoryById error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const getCategoryPosts = async (req, res) => {
    try {
        const { category_id } = req.params;

        const category = await Category.getById(category_id);
        if (!category) return res.status(404).json({ error: "Category not found" });

        const posts = await Category.getPosts(category_id);

        if (!posts.length) {
            return res.status(404).json({ error: "No posts found for this category" });
        }

        res.json(posts);
    } catch (err) {
        console.error("getCategoryPosts error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: "Title is required" });

        const categoryId = await Category.create({ title, description });
        res.status(201).json({ message: "Category created", category_id: categoryId });
    } catch (err) {
        console.error("createCategory error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const fields = req.body;

        if (!Object.keys(fields).length)
            return res.status(400).json({ error: "No fields to update" });

        const category = await Category.getById(category_id);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        await Category.update(category_id, fields);
        res.json({ message: "Category updated" });
    } catch (err) {
        console.error("updateCategory error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { category_id } = req.params;

        const category = await Category.getById(category_id);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        await Category.delete(category_id);
        res.json({ message: "Category deleted" });
    } catch (err) {
        console.error("deleteCategory error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
