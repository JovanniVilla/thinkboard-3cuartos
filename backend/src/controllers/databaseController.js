import BoardConfig from "../models/BoardConfig.js";
import LabelConfig from "../models/LabelConfig.js";
import Note from "../models/Note.js";
import PriorityConfig from "../models/PriorityConfig.js";
import StatusConfig from "../models/StatusConfig.js";
import User from "../models/User.js";

const models = {
  BoardConfig,
  LabelConfig,
  Note,
  PriorityConfig,
  StatusConfig,
  User,
};

// @desc    Export entire database
// @route   GET /api/database/export
// @access  Private/Admin
export const exportDatabase = async (req, res) => {
  try {
    const backup = {};

    for (const [key, Model] of Object.entries(models)) {
      const docs = await Model.find({}).lean();
      backup[key] = docs;
    }

    res.status(200).json(backup);
  } catch (error) {
    console.error("Error in exportDatabase:", error.message);
    res.status(500).json({ message: "Error al exportar la base de datos" });
  }
};

// @desc    Preview database import (Reconciliation)
// @route   POST /api/database/import/preview
// @access  Private/Admin
export const previewImport = async (req, res) => {
  try {
    const backup = req.body;
    let existingCount = 0;
    let newCount = 0;

    for (const [key, Model] of Object.entries(models)) {
      if (backup[key] && Array.isArray(backup[key])) {
        for (const doc of backup[key]) {
          // Check if document exists by _id
          if (doc._id) {
            const exists = await Model.exists({ _id: doc._id });
            if (exists) {
              existingCount++;
            } else {
              newCount++;
            }
          } else {
             newCount++;
          }
        }
      }
    }

    res.status(200).json({ existingCount, newCount });
  } catch (error) {
    console.error("Error in previewImport:", error.message);
    res.status(500).json({ message: "Error al previsualizar la importación" });
  }
};

// @desc    Import database (Upsert)
// @route   POST /api/database/import
// @access  Private/Admin
export const importDatabase = async (req, res) => {
  try {
    const backup = req.body;

    let updatedCount = 0;
    let insertedCount = 0;
    let matchedCount = 0;

    for (const [key, Model] of Object.entries(models)) {
      if (backup[key] && Array.isArray(backup[key])) {
        const ops = backup[key].map((doc) => {
          const { _id, ...updateData } = doc;
          return {
            updateOne: {
              filter: { _id },
              update: { $set: updateData },
              upsert: true,
            },
          };
        });

        if (ops.length > 0) {
          const result = await Model.bulkWrite(ops);
          matchedCount += result.matchedCount || 0;
          updatedCount += result.modifiedCount || 0;
          insertedCount += result.upsertedCount || 0;
        }
      }
    }

    res.status(200).json({
      message: "Base de datos importada correctamente",
      matchedCount,
      updatedCount,
      insertedCount,
    });
  } catch (error) {
    console.error("Error in importDatabase:", error.message);
    res.status(500).json({ message: "Error al importar la base de datos" });
  }
};
