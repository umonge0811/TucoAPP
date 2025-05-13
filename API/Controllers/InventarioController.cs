using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class InventarioController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
