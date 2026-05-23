from py_backend.structural import class_models as cmodels
from . import parsers as p
import subprocess
import json

java_code = """

public abstract class Enemy {
    protected Position pos;
    protected Game.Direction direction;
    protected BFSPathFinder finder;
    protected double speed = 0.1;

    protected double visualRow;
    protected double visualCol;

    public Enemy(Position pos){
        this.pos = pos;
        this.direction = Game.Direction.NONE;
        this.visualRow = pos.getRow();
        this.visualCol = pos.getCol();
        this.finder = new BFSPathFinder();
    }

    public double getVisualRow() {
        return visualRow;
    }

    public double getVisualCol() {
        return visualCol;
    }

    public Game.Direction getDirection() {
        return direction;
    }

    public abstract Position selectTarget(Player player, MapData mapData);

    protected Game.Direction getDirectionFromPositions(Position from, Position to) {
        int dRow = to.getRow() - from.getRow();
        int dCol = to.getCol() - from.getCol();

        if (dRow == 0 && dCol == 0) return Game.Direction.NONE;
        else if (dRow == 0 && dCol == 1) return Game.Direction.RIGHT;
        else if (dRow == 0 && dCol == -1) return Game.Direction.LEFT;
        else if (dRow == 1 && dCol == 0) return Game.Direction.DOWN;
        else if (dRow == -1 && dCol == 0) return Game.Direction.UP;
        else return Game.Direction.NONE;
    }

    public void move(Player player, MapData mapData) {
        Position target = selectTarget(player, mapData);
        if (target == null) return;

        ArrayList<Position> path = finder.getFullShortestPath(pos, target, mapData);
        if (path == null) return;

        Position nextPos = path.size() == 1 ? path.get(0) : path.get(1);
        Game.Direction dir = getDirectionFromPositions(pos, nextPos);

        boolean isInASquare = Math.abs(visualRow - pos.getRow()) < 0.1
                && Math.abs(visualCol - pos.getCol()) < 0.1;
        if (isInASquare) {
            if (dir != direction) {
                visualRow = pos.getRow();
                visualCol = pos.getCol();
            }
            setDirection(dir);
        }

        double rowStep = speed * direction.getDRow();
        double colStep = speed * direction.getDCol();

        visualRow += rowStep;
        visualCol += colStep;
    }

    public void setDirection(Game.Direction direction) {
        this.direction = direction;
    }

    public void setPos(Position pos) {
        this.pos = pos;
    }

    public void reset(MapData mapData) {
        direction = Game.Direction.NONE;
    }
}

"""

class Converter:

    @staticmethod
    def run():

        result = subprocess.run(
            ["java", "-jar", f"java_parser\\parser\\target\\parser-1.0-SNAPSHOT.jar"],
            input=java_code,
            text=True,
            capture_output=True
        )
        class_structs = json.loads(result.stdout)
        c_models = []

        for cs in class_structs:
            t = cs.pop('type_', None)
            cs['fields'] = p.parse_fields(cs['fields'])
            cs['methods'] = p.parse_methods(cs['methods'])

            if t == 'CLASS':
                cs['constructors'] = p.parse_constructors(cs['constructors'])
                c_model = cmodels.ClassObj(**cs)

            elif t == 'RECORD':
                cs['parameters'] = p.parse_parameters(cs['parameters'])
                cs['constructors'] = p.parse_constructors(cs['constructors'])
                c_model = cmodels.RecordObj(**cs)

            elif t == 'INTERFACE':
                c_model = cmodels.InterfaceObj(**cs)

            elif t == 'ENUM':
                cs['constants'] = p.parse_constants(cs['constants'])
                cs['constructors'] = p.parse_constructors(cs['constructors'])
                c_model = cmodels.EnumObj(**cs)
            else:
                raise TypeError('Invalid class type')
            c_models.append(c_model)

        return c_models