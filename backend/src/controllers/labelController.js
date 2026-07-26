import LabelConfig from "../models/LabelConfig.js";

export const getAllLabels = async (req, res) => {
  try {
    const labels = await LabelConfig.find().sort({ order: 1 });
    res.status(200).json(labels);
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({ message: "Error al obtener las etiquetas" });
  }
};

export const createLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: "El nombre es obligatorio" });

    // get max order
    const maxOrderLabel = await LabelConfig.findOne().sort("-order");
    const newOrder = maxOrderLabel ? maxOrderLabel.order + 1 : 0;

    const label = new LabelConfig({
      name: name.trim(),
      color: color || "#3B82F6",
      order: newOrder,
    });

    const savedLabel = await label.save();
    res.status(201).json(savedLabel);
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ message: "Error al crear la etiqueta" });
  }
};

export const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    const label = await LabelConfig.findById(id);
    if (!label) return res.status(404).json({ message: "Etiqueta no encontrada" });

    if (name !== undefined) label.name = name.trim();
    if (color !== undefined) label.color = color;
    if (order !== undefined) label.order = order;

    const updatedLabel = await label.save();
    res.status(200).json(updatedLabel);
  } catch (error) {
    console.error("Error updating label:", error);
    res.status(500).json({ message: "Error al actualizar la etiqueta" });
  }
};

export const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const label = await LabelConfig.findByIdAndDelete(id);

    if (!label) return res.status(404).json({ message: "Etiqueta no encontrada" });

    res.status(200).json({ message: "Etiqueta eliminada", id });
  } catch (error) {
    console.error("Error deleting label:", error);
    res.status(500).json({ message: "Error al eliminar la etiqueta" });
  }
};
