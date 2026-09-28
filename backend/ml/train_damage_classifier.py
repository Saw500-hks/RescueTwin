import argparse
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from app.models.damage_classifier import SiameseDamageNet
from ml.dataset import XBDDataset

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', type=str, default='data')
    parser.add_argument('--output_dir', type=str, default='outputs')
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=1e-4)
    args = parser.parse_args()

    model = SiameseDamageNet()
    criterion = nn.CrossEntropyLoss(weight=torch.tensor([0.1, 0.3, 0.3, 0.3]))
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    # dataset = XBDDataset(args.data_dir)
    # dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)

    for epoch in range(args.epochs):
        print(f"Epoch {epoch}/{args.epochs}")
        # Training loop would go here

    torch.save(model.state_dict(), f"{args.output_dir}/best_model.pt")

if __name__ == '__main__':
    main()
